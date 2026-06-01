/**
 * Track a shipment by carrier + tracking number.
 *
 *   SHIPPO_TOKEN=shippo_test_xxx npx tsx examples/track.ts usps 9205590164917312751089
 */
import { ShippoClient } from "../src/index.js";

const [carrier = "shippo", trackingNumber = "SHIPPO_DELIVERED"] = process.argv.slice(2);

const shippo = new ShippoClient({ token: process.env.SHIPPO_TOKEN! });
const status = await shippo.track(carrier, trackingNumber);

console.log(`Carrier: ${status.carrier}`);
console.log(`Status:  ${status.tracking_status?.status ?? "UNKNOWN"}`);
if (status.eta) console.log(`ETA:     ${status.eta}`);
console.log(`History: ${status.tracking_history?.length ?? 0} events`);
