# shippo-lite

> Tiny, zero-dependency, fully-typed [Shippo](https://goshippo.com) client for Node & edge runtimes. Rates, labels, and tracking in three calls.

[![CI](https://github.com/__GH_USER__/shippo-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/__GH_USER__/shippo-lite/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/shippo-lite.svg)](https://www.npmjs.com/package/shippo-lite)
[![bundle size](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#why)
[![types](https://img.shields.io/badge/types-included-blue.svg)](#)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

The official `shippo` SDK is great, but it pulls in a lot if all you want is to
**quote a rate, buy a label, and track a package**. `shippo-lite` does exactly
that — in ~5 KB, with no dependencies, using the platform `fetch`. It runs on
**Node 18+, Bun, Deno, Cloudflare Workers, and Vercel Edge**.

## Install

```bash
npm install shippo-lite
```

## Quick start

```ts
import { ShippoClient } from "shippo-lite";

const shippo = new ShippoClient({ token: process.env.SHIPPO_TOKEN! });

// 1. Get rates
const rates = await shippo.getRates({
  addressFrom: { street1: "215 Clayton St.", city: "San Francisco", state: "CA", zip: "94117", country: "US" },
  addressTo:   { street1: "Broadway 1",      city: "New York",      state: "NY", zip: "10007", country: "US" },
  parcels:     { length: 5, width: 5, height: 5, distance_unit: "in", weight: 2, mass_unit: "lb" },
});

// 2. Pick one (or use shippo.cheapestRate(...) to skip the sort)
const cheapest = rates.sort((a, b) => +a.amount - +b.amount)[0];

// 3. Buy the label
const label = await shippo.buyLabel(cheapest.object_id);
console.log(label.tracking_number, label.label_url);
```

> **Tip:** use a `shippo_test_*` token while developing — test labels are free.

## API

### `new ShippoClient(options)`

| Option       | Type            | Default                     | Description                                  |
| ------------ | --------------- | --------------------------- | -------------------------------------------- |
| `token`      | `string`        | —                           | **Required.** Your Shippo API token.         |
| `baseUrl`    | `string`        | `https://api.goshippo.com`  | Override the API host.                       |
| `timeoutMs`  | `number`        | `30000`                     | Per-request timeout.                         |
| `fetch`      | `typeof fetch`  | global `fetch`              | Inject a custom fetch (tests/edge runtimes). |
| `apiVersion` | `string`        | —                           | Pin a Shippo API version date.               |

### Methods

| Method | Description |
| --- | --- |
| `getRates({ addressFrom, addressTo, parcels })` | Create a shipment and return its `Rate[]`. |
| `cheapestRate({ ... })` | Same inputs as `getRates`, returns the single lowest-priced `Rate`. |
| `createShipment({ ... })` | Lower-level: returns the full `Shipment` (rates + echoed addresses). |
| `buyLabel(rateId, fileType?)` | Purchase a label for a rate. `fileType` defaults to `"PDF_4x6"`. |
| `getTransaction(id)` | Fetch a previously purchased label/transaction. |
| `track(carrier, trackingNumber)` | Get current tracking status + history. |

`parcels` accepts either a single parcel object or an array — single parcels are
normalized for you.

## Errors

Every non-2xx response throws a typed `ShippoError`:

```ts
import { ShippoError, ShippoTimeoutError } from "shippo-lite";

try {
  await shippo.buyLabel("rate_does_not_exist");
} catch (err) {
  if (err instanceof ShippoError) {
    console.error(err.status, err.message, err.body);
  } else if (err instanceof ShippoTimeoutError) {
    console.error("Timed out after", err.timeoutMs, "ms");
  }
}
```

## Why

- **Zero dependencies.** Nothing to audit, nothing to bloat your bundle.
- **Edge-ready.** Uses `fetch`, so it deploys to Workers / Vercel Edge unchanged.
- **Typed end to end.** Addresses, parcels, rates, labels, tracking — all typed.
- **Timeouts + typed errors** built in, not bolted on.

If you need carrier-account management, customs declarations, batch labels, or
webhooks, reach for the [official SDK](https://github.com/goshippo/shippo-python-client) —
`shippo-lite` deliberately covers the 80% path.

## Examples

Runnable scripts live in [`examples/`](./examples):

```bash
SHIPPO_TOKEN=shippo_test_xxx npx tsx examples/quote-and-buy.ts
SHIPPO_TOKEN=shippo_test_xxx npx tsx examples/track.ts usps <tracking_number>
```

## Development

```bash
npm install
npm run typecheck
npm test          # vitest, fully mocked — no network, no token needed
npm run build
```

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Jianhua Yang

---

> Not affiliated with or endorsed by Shippo. "Shippo" is a trademark of its respective owner.
