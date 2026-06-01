# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-01

### Added

- Initial release.
- `ShippoClient` with `getRates`, `cheapestRate`, `createShipment`, `buyLabel`,
  `getTransaction`, and `track`.
- Typed `ShippoError` and `ShippoTimeoutError`.
- Full TypeScript types for addresses, parcels, rates, shipments, transactions,
  and tracking.
- Zero runtime dependencies; works on Node 18+, Bun, Deno, and edge runtimes.
- Test suite (vitest, fully mocked) and CI across Node 18/20/22.
