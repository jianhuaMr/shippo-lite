import { ShippoError, ShippoTimeoutError } from "./errors.js";
import type {
  Address,
  LabelFileType,
  Parcel,
  Rate,
  Shipment,
  ShippoClientOptions,
  TrackingStatus,
  Transaction,
} from "./types.js";

export * from "./types.js";
export { ShippoError, ShippoTimeoutError } from "./errors.js";

const DEFAULT_BASE_URL = "https://api.goshippo.com";
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * A tiny, fully-typed client for the Shippo shipping API.
 *
 * Zero dependencies — it uses the platform `fetch`, so it runs on Node 18+,
 * Bun, Deno, Cloudflare Workers, and Vercel Edge functions alike.
 *
 * @example
 * ```ts
 * const shippo = new ShippoClient({ token: process.env.SHIPPO_TOKEN! });
 * const rates = await shippo.getRates({ addressFrom, addressTo, parcels });
 * const cheapest = rates.sort((a, b) => +a.amount - +b.amount)[0];
 * const label = await shippo.buyLabel(cheapest.object_id);
 * console.log(label.label_url);
 * ```
 */
export class ShippoClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly apiVersion?: string;

  constructor(options: ShippoClientOptions) {
    if (!options?.token) {
      throw new Error("ShippoClient requires a `token`.");
    }
    this.token = options.token;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.apiVersion = options.apiVersion;

    const f = options.fetch ?? globalThis.fetch;
    if (typeof f !== "function") {
      throw new Error(
        "No global `fetch` found. Use Node 18+, or pass `fetch` in options.",
      );
    }
    // Bind so `this` inside fetch (some polyfills care) stays correct.
    this.fetchImpl = f.bind(globalThis);
  }

  /**
   * Create a shipment and return the carrier rates quoted for it.
   * This is the most common entry point — most callers only need rates.
   */
  async getRates(input: {
    addressFrom: Address;
    addressTo: Address;
    parcels: Parcel | Parcel[];
  }): Promise<Rate[]> {
    const shipment = await this.createShipment(input);
    return shipment.rates ?? [];
  }

  /** Create a shipment object (returns the full shipment incl. rates). */
  async createShipment(input: {
    addressFrom: Address;
    addressTo: Address;
    parcels: Parcel | Parcel[];
  }): Promise<Shipment> {
    const parcels = Array.isArray(input.parcels)
      ? input.parcels
      : [input.parcels];

    return this.request<Shipment>("POST", "/shipments/", {
      address_from: input.addressFrom,
      address_to: input.addressTo,
      parcels,
      async: false,
    });
  }

  /**
   * Purchase a shipping label for a given rate.
   *
   * @param rateId    The `object_id` of the rate to buy (from {@link getRates}).
   * @param fileType  Label format. Defaults to `"PDF_4x6"` (thermal-friendly).
   */
  async buyLabel(
    rateId: string,
    fileType: LabelFileType = "PDF_4x6",
  ): Promise<Transaction> {
    if (!rateId) throw new Error("buyLabel requires a `rateId`.");
    return this.request<Transaction>("POST", "/transactions/", {
      rate: rateId,
      label_file_type: fileType,
      async: false,
    });
  }

  /** Retrieve a previously created transaction (label) by id. */
  async getTransaction(transactionId: string): Promise<Transaction> {
    if (!transactionId) throw new Error("getTransaction requires an id.");
    return this.request<Transaction>(
      "GET",
      `/transactions/${encodeURIComponent(transactionId)}`,
    );
  }

  /**
   * Get the current tracking status for a shipment.
   *
   * @param carrier         Carrier token, e.g. "usps", "ups", "fedex".
   * @param trackingNumber  The carrier tracking number.
   */
  async track(
    carrier: string,
    trackingNumber: string,
  ): Promise<TrackingStatus> {
    if (!carrier || !trackingNumber) {
      throw new Error("track requires `carrier` and `trackingNumber`.");
    }
    return this.request<TrackingStatus>(
      "GET",
      `/tracks/${encodeURIComponent(carrier)}/${encodeURIComponent(trackingNumber)}`,
    );
  }

  /** Convenience: create a shipment and return its single cheapest rate. */
  async cheapestRate(input: {
    addressFrom: Address;
    addressTo: Address;
    parcels: Parcel | Parcel[];
  }): Promise<Rate | undefined> {
    const rates = await this.getRates(input);
    return [...rates].sort((a, b) => Number(a.amount) - Number(b.amount))[0];
  }

  // --- internal --------------------------------------------------------

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `ShippoToken ${this.token}`,
      Accept: "application/json",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.apiVersion) headers["Shippo-API-Version"] = this.apiVersion;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new ShippoTimeoutError(this.timeoutMs);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    const parsed = text ? safeJson(text) : undefined;

    if (!res.ok) {
      const message =
        (isRecord(parsed) && typeof parsed["detail"] === "string"
          ? parsed["detail"]
          : undefined) ?? `Shippo API error ${res.status} ${res.statusText}`;
      throw new ShippoError(message, res.status, parsed ?? text);
    }

    return parsed as T;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default ShippoClient;
