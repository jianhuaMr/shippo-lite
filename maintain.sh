#!/usr/bin/env bash
# Push polish commits, cut a v0.1.0 GitHub Release, and open roadmap issues.
# Requires GITHUB_TOKEN (present in a fresh runtime session).
set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN is empty. Run this in a fresh session." >&2
  exit 1
fi

API="https://api.github.com"
AUTH="Authorization: Bearer ${GITHUB_TOKEN}"
USER_LOGIN=$(curl -fsSL -H "$AUTH" "$API/user" | python3 -c "import sys,json;print(json.load(sys.stdin)['login'])")
REPO="${USER_LOGIN}/shippo-lite"
echo "Repo: $REPO"

# 1. Push latest commits.
git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
git push origin main
git remote set-url origin "https://github.com/${REPO}.git"

# 2. Create v0.1.0 Release (tags HEAD of main). Idempotent-ish: skip if exists.
REL_CODE=$(curl -s -o /tmp/rel.json -w "%{http_code}" -H "$AUTH" "$API/repos/${REPO}/releases/tags/v0.1.0")
if [ "$REL_CODE" = "200" ]; then
  echo "Release v0.1.0 already exists — skipping."
else
  python3 - "$AUTH" "$API" "$REPO" <<'PY'
import json, sys, urllib.request
auth, api, repo = sys.argv[1], sys.argv[2], sys.argv[3]
notes = """### shippo-lite v0.1.0 — first release

Tiny, zero-dependency, fully-typed Shippo client for Node & edge runtimes.

**Highlights**
- `getRates` / `cheapestRate` / `createShipment` / `buyLabel` / `getTransaction` / `track`
- Zero runtime dependencies — runs on Node 18+, Bun, Deno, Cloudflare Workers, Vercel Edge
- Typed `ShippoError` / `ShippoTimeoutError`, per-request timeouts
- Full mocked test suite, CI across Node 18/20/22, MIT licensed

See the README for usage and the roadmap for what's next.
"""
body = json.dumps({
    "tag_name": "v0.1.0",
    "target_commitish": "main",
    "name": "v0.1.0",
    "body": notes,
    "draft": False,
    "prerelease": False,
}).encode()
req = urllib.request.Request(f"{api}/repos/{repo}/releases", data=body, method="POST")
req.add_header("Authorization", auth.split(": ",1)[1])
req.add_header("Accept", "application/vnd.github+json")
with urllib.request.urlopen(req) as r:
    print("Release created:", json.load(r)["html_url"])
PY
fi

# 3. Open roadmap issues (only if none open yet, to stay idempotent).
OPEN_COUNT=$(curl -fsSL -H "$AUTH" "$API/repos/${REPO}/issues?state=open&per_page=1" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
if [ "$OPEN_COUNT" -gt 0 ]; then
  echo "Issues already present — skipping issue creation."
else
  create_issue () {
    local title="$1"; local label="$2"; local bodyfile="$3"
    python3 - "$AUTH" "$API" "$REPO" "$title" "$label" "$bodyfile" <<'PY'
import json, sys, urllib.request
auth, api, repo, title, label, bodyfile = sys.argv[1:7]
body = open(bodyfile).read()
data = json.dumps({"title": title, "body": body, "labels": [label]}).encode()
req = urllib.request.Request(f"{api}/repos/{repo}/issues", data=data, method="POST")
req.add_header("Authorization", auth.split(": ",1)[1])
req.add_header("Accept", "application/vnd.github+json")
with urllib.request.urlopen(req) as r:
    print("Issue:", json.load(r)["html_url"])
PY
  }

  cat > /tmp/i1.md <<'EOF'
Publish the package to npm so `npm install shippo-lite` works and download
metrics are available.

- [ ] Reserve the `shippo-lite` name
- [ ] `npm publish --access public` from CI on tagged releases
- [ ] Add provenance once on a CI runner
EOF
  cat > /tmp/i2.md <<'EOF'
Add a thin `validateAddress(address)` helper wrapping Shippo's address
validation, returning typed validation messages. Should stay zero-dependency
and follow the existing `request()` pattern.
EOF
  cat > /tmp/i3.md <<'EOF'
Optional, opt-in retry with exponential backoff for `429` and `5xx` responses.
Keep it off by default; expose `maxRetries` in `ShippoClientOptions`. Must not
add any runtime dependency.
EOF

  create_issue "Publish shippo-lite to npm" "enhancement" /tmp/i1.md
  create_issue "Add address validation helper (validateAddress)" "enhancement" /tmp/i2.md
  create_issue "Optional retry with backoff on 429/5xx" "enhancement" /tmp/i3.md
fi

echo ""
echo "Done. https://github.com/${REPO}/releases  and  /issues"
