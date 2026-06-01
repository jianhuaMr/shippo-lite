---
title: "shippo-lite: a 5 KB, zero-dependency Shippo client for Node & the edge"
published: false
tags: javascript, typescript, node, webdev
canonical_url:
cover_image:
---

If you've ever wired up shipping in a side project, you know the drill: you just
want to **quote a rate, buy a label, and track the package** — but the official
SDK pulls in more than you need, and half of it won't even run on the edge.

So I wrote [**shippo-lite**](https://github.com/jianhuaMr/shippo-lite): a tiny,
**zero-dependency**, fully-typed [Shippo](https://goshippo.com) client. It's
~5 KB, uses the platform `fetch`, and runs unchanged on **Node 18+, Bun, Deno,
Cloudflare Workers, and Vercel Edge**.

```bash
npm install shippo-lite
```

## Three calls, end to end

```ts
import { ShippoClient } from "shippo-lite";

const shippo = new ShippoClient({ token: process.env.SHIPPO_TOKEN! });

// 1. Quote rates
const rates = await shippo.getRates({
  addressFrom: { street1: "215 Clayton St.", city: "San Francisco", state: "CA", zip: "94117", country: "US" },
  addressTo:   { street1: "Broadway 1",      city: "New York",      state: "NY", zip: "10007", country: "US" },
  parcels:     { length: 5, width: 5, height: 5, distance_unit: "in", weight: 2, mass_unit: "lb" },
});

// 2. Pick the cheapest (or call shippo.cheapestRate(...) and skip the sort)
const cheapest = rates.sort((a, b) => +a.amount - +b.amount)[0];

// 3. Buy the label
const label = await shippo.buyLabel(cheapest.object_id);
console.log(label.tracking_number, label.label_url);
```

Tracking is one call too:

```ts
const status = await shippo.track("usps", "9405511899223197428490");
console.log(status.tracking_status?.status); // e.g. "DELIVERED"
```

## Why another Shippo client?

- **Zero dependencies.** Nothing to audit, nothing to bloat your bundle.
- **Edge-ready.** It's `fetch` under the hood, so the same code deploys to
  Cloudflare Workers and Vercel Edge — where the official SDK's Node-isms break.
- **Typed end to end.** Addresses, parcels, rates, labels, and tracking are all
  typed, so your editor autocompletes the whole flow.
- **Timeouts + typed errors** are built in. Non-2xx responses throw a
  `ShippoError` with `status` and `body`; slow requests throw a
  `ShippoTimeoutError` instead of hanging.

```ts
import { ShippoError } from "shippo-lite";

try {
  await shippo.buyLabel("rate_that_does_not_exist");
} catch (err) {
  if (err instanceof ShippoError) console.error(err.status, err.body);
}
```

## Scope on purpose

shippo-lite deliberately covers the 80% path. If you need carrier-account
management, customs declarations, batch labels, or webhooks, the official SDK is
the right tool. For "quote, buy, track" in a serverless function, this is the
smaller, faster option.

## Try it

- npm: <https://www.npmjs.com/package/shippo-lite>
- GitHub: <https://github.com/jianhuaMr/shippo-lite>

It's MIT-licensed and has a small roadmap (address validation, opt-in retries,
batch labels) tracked in the issues. PRs and feedback welcome — if you ship with
it, I'd love to hear what's missing.
