import { describe, it, expect, vi } from "vitest";
import { ShippoClient, ShippoError, ShippoTimeoutError } from "../src/index.js";

const addressFrom = {
  name: "Warehouse",
  street1: "215 Clayton St.",
  city: "San Francisco",
  state: "CA",
  zip: "94117",
  country: "US",
};
const addressTo = {
  name: "Mr Hippo",
  street1: "Broadway 1",
  city: "New York",
  state: "NY",
  zip: "10007",
  country: "US",
};
const parcel = {
  length: 5,
  width: 5,
  height: 5,
  distance_unit: "in" as const,
  weight: 2,
  mass_unit: "lb" as const,
};

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("ShippoClient", () => {
  it("throws if no token is provided", () => {
    // @ts-expect-error intentionally missing token
    expect(() => new ShippoClient({})).toThrow(/token/i);
  });

  it("sends the ShippoToken auth header and returns rates", async () => {
    const fetch = mockFetch(201, {
      object_id: "ship_1",
      status: "SUCCESS",
      rates: [
        { object_id: "rate_1", amount: "5.50", currency: "USD", provider: "USPS", servicelevel: { name: "Priority", token: "usps_priority" } },
      ],
    });
    const shippo = new ShippoClient({ token: "shippo_test_abc", fetch });

    const rates = await shippo.getRates({ addressFrom, addressTo, parcels: parcel });

    expect(rates).toHaveLength(1);
    expect(rates[0]!.amount).toBe("5.50");

    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe("https://api.goshippo.com/shipments/");
    expect((init!.headers as Record<string, string>).Authorization).toBe(
      "ShippoToken shippo_test_abc",
    );
    // single parcel should be normalized to an array
    expect(JSON.parse(init!.body as string).parcels).toHaveLength(1);
  });

  it("cheapestRate returns the lowest-priced rate", async () => {
    const fetch = mockFetch(201, {
      object_id: "ship_1",
      status: "SUCCESS",
      rates: [
        { object_id: "r1", amount: "9.99", currency: "USD", provider: "UPS", servicelevel: { name: "Ground", token: "ups_ground" } },
        { object_id: "r2", amount: "5.50", currency: "USD", provider: "USPS", servicelevel: { name: "Priority", token: "usps_priority" } },
      ],
    });
    const shippo = new ShippoClient({ token: "t", fetch });
    const rate = await shippo.cheapestRate({ addressFrom, addressTo, parcels: parcel });
    expect(rate?.object_id).toBe("r2");
  });

  it("buyLabel posts to /transactions/ with the rate id", async () => {
    const fetch = mockFetch(201, {
      object_id: "txn_1",
      status: "SUCCESS",
      rate: "rate_1",
      label_url: "https://example.com/label.pdf",
    });
    const shippo = new ShippoClient({ token: "t", fetch });
    const txn = await shippo.buyLabel("rate_1");
    expect(txn.label_url).toContain("label.pdf");
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe("https://api.goshippo.com/transactions/");
    expect(JSON.parse(init!.body as string).rate).toBe("rate_1");
  });

  it("track builds the correct URL", async () => {
    const fetch = mockFetch(200, {
      carrier: "usps",
      tracking_number: "9400111899223817612345",
      tracking_status: { status: "DELIVERED" },
    });
    const shippo = new ShippoClient({ token: "t", fetch });
    const status = await shippo.track("usps", "9400111899223817612345");
    expect(status.tracking_status?.status).toBe("DELIVERED");
    expect(String(fetch.mock.calls[0]![0])).toBe(
      "https://api.goshippo.com/tracks/usps/9400111899223817612345",
    );
  });

  it("throws ShippoError on a non-2xx response", async () => {
    const fetch = mockFetch(401, { detail: "Invalid token." });
    const shippo = new ShippoClient({ token: "bad", fetch });
    await expect(shippo.track("usps", "1")).rejects.toMatchObject({
      name: "ShippoError",
      status: 401,
    });
    await expect(shippo.track("usps", "1")).rejects.toBeInstanceOf(ShippoError);
  });

  it("throws ShippoTimeoutError when the request aborts", async () => {
    const fetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    const shippo = new ShippoClient({ token: "t", fetch: fetch as unknown as typeof globalThis.fetch, timeoutMs: 10 });
    await expect(shippo.track("usps", "1")).rejects.toBeInstanceOf(ShippoTimeoutError);
  });
});
