# Contributing to shippo-lite

Thanks for your interest in improving shippo-lite! This project aims to stay
**small, typed, and dependency-free** — please keep that in mind for PRs.

## Getting started

```bash
git clone https://github.com/__GH_USER__/shippo-lite.git
cd shippo-lite
npm install
npm test
```

## Ground rules

- **No runtime dependencies.** The whole point is zero deps. Dev-only deps
  (TypeScript, vitest) are fine.
- **Tests are mocked.** `npm test` must pass with no network and no API token.
  Add a test for every new method or bug fix.
- **Keep it typed.** `npm run typecheck` must pass with `strict` on.
- **Scope.** We cover the common path (rates, labels, tracking). Large new
  surface areas (customs, batch, webhooks) are probably better in the official
  SDK — open an issue first to discuss.

## Submitting a PR

1. Fork and create a feature branch.
2. `npm run typecheck && npm test && npm run build` all green.
3. Describe the change and link any related issue.

## Reporting bugs

Open an issue with a minimal reproduction — ideally a failing test against the
mocked client. Include the Shippo endpoint involved and the response shape.
