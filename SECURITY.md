# Security Policy

## Supported versions

shippo-lite is pre-1.0. Security fixes are applied to the latest published
`0.x` release.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Instead, use GitHub's private vulnerability reporting:
**Security → Report a vulnerability** on this repository, or email the
maintainer listed in `package.json`.

You can expect an acknowledgement within 72 hours. Once a fix is ready, a
patched release will be published and the reporter credited (unless they prefer
to remain anonymous).

## Scope

shippo-lite has **zero runtime dependencies** and makes outbound HTTPS requests
only to the configured Shippo API base URL. It never logs or persists your API
token. Reports about token handling, request construction, or error leakage are
especially welcome.
