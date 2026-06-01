/**
 * End-to-end example: quote rates, pick the cheapest, buy a label.
 *
 *   SHIPPO_TOKEN=shippo_test_xxx npx tsx examples/quote-and-buy.ts
 *
 * Use a `shippo_test_*` token — test labels are free and not billed.
 */
import { ShippoClient } from "../src/index.js";

const shippo = new ShippoClient({ token: process.env.SHIPPO_TOKEN! });

const addressFrom = {
  name: "Shawn Ippotle",
  company: "Shippo",
  street1: "215 Clayton St.",
  city: "San Francisco",
  state: "CA",
  zip: "94117",
  country: "US",
  phone: "+1 555 341 9393",
  email: "shippotle@shippo.com",
};

const addressTo = {
  name: "Mr Hippo",
  street1: "Broadway 1",
  city: "New York",
  state: "NY",
  zip: "10007",
  country: "US",
  phone: "+1 555 341 9393",
  email: "mrhippo@shippo.com",
};

const parcel = {
  length: 5,
  width: 5,
  height: 5,
  distance_unit: "in",
  weight: 2,
  mass_unit: "lb",
} as const;

const rates = await shippo.getRates({ addressFrom, addressTo, parcels: parcel });
console.log(`Got ${rates.length} rates:`);
for (const r of rates) {
  console.log(`  ${r.provider} ${r.servicelevel.name}: $${r.amount} ${r.currency}`);
}

const cheapest = await shippo.cheapestRate({ addressFrom, addressTo, parcels: parcel });
if (!cheapest) throw new Error("No rates returned.");
console.log(`\nCheapest: ${cheapest.provider} $${cheapest.amount}`);

const label = await shippo.buyLabel(cheapest.object_id);
console.log("Tracking number:", label.tracking_number);
console.log("Label URL:", label.label_url);
