/**
 * Type definitions for the Shippo REST API surface that shippo-lite covers.
 * These mirror the fields returned by https://api.goshippo.com and are
 * intentionally a pragmatic subset — the fields you actually use day to day.
 *
 * @see https://docs.goshippo.com/shippoapi/public-api/
 */

/** A postal address used as the origin or destination of a shipment. */
export interface Address {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  /** State / province code, e.g. "CA". Required for US/CA addresses. */
  state?: string;
  zip: string;
  /** Two-letter ISO country code, e.g. "US". */
  country: string;
  phone?: string;
  email?: string;
}

/** Physical dimensions and weight of a parcel. */
export interface Parcel {
  length: string | number;
  width: string | number;
  height: string | number;
  /** One of: "cm" | "in" | "ft" | "mm" | "m" | "yd". */
  distance_unit: DistanceUnit;
  weight: string | number;
  /** One of: "g" | "oz" | "lb" | "kg". */
  mass_unit: MassUnit;
}

export type DistanceUnit = "cm" | "in" | "ft" | "mm" | "m" | "yd";
export type MassUnit = "g" | "oz" | "lb" | "kg";

/** A single carrier rate returned for a shipment. */
export interface Rate {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
    terms?: string;
  };
  /** Estimated transit time in days, when the carrier provides it. */
  estimated_days?: number;
  duration_terms?: string;
  attributes?: string[];
}

/** A created shipment, including the rates quoted for it. */
export interface Shipment {
  object_id: string;
  status: string;
  address_from: Address & { object_id?: string };
  address_to: Address & { object_id?: string };
  parcels: Array<Parcel & { object_id?: string }>;
  rates: Rate[];
  messages?: ShippoMessage[];
}

/** A purchased label / transaction. */
export interface Transaction {
  object_id: string;
  status: "SUCCESS" | "ERROR" | "QUEUED" | "WAITING" | string;
  rate: string;
  tracking_number?: string;
  tracking_status?: string;
  tracking_url_provider?: string;
  /** URL to the generated label file (PDF/PNG/ZPL depending on request). */
  label_url?: string;
  commercial_invoice_url?: string;
  messages?: ShippoMessage[];
}

/** Tracking status for a shipment in transit. */
export interface TrackingStatus {
  carrier: string;
  tracking_number: string;
  eta?: string;
  servicelevel?: { name?: string; token?: string };
  tracking_status?: {
    status: string;
    status_details?: string;
    status_date?: string;
    location?: TrackingLocation;
  };
  tracking_history?: Array<{
    status: string;
    status_details?: string;
    status_date?: string;
    location?: TrackingLocation;
  }>;
}

export interface TrackingLocation {
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/** A non-fatal message returned by the Shippo API (e.g. address warnings). */
export interface ShippoMessage {
  source?: string;
  code?: string;
  text: string;
}

export type LabelFileType = "PDF" | "PDF_4x6" | "PNG" | "ZPLII";

/** Options accepted when constructing a {@link ShippoClient}. */
export interface ShippoClientOptions {
  /** Your Shippo API token (test: `shippo_test_…`, live: `shippo_live_…`). */
  token: string;
  /** Override the API base URL. Defaults to `https://api.goshippo.com`. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number;
  /** Inject a custom fetch (for tests or non-standard runtimes). */
  fetch?: typeof fetch;
  /** Shippo API version date header, e.g. "2018-02-08". Optional. */
  apiVersion?: string;
}
