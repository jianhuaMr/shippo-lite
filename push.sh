#!/usr/bin/env bash
# One-shot: create the GitHub repo and push shippo-lite.
# Requires GITHUB_TOKEN in the environment (available after a runtime restart,
# since the GitHub connection was added mid-session).
set -euo pipefail

cd "$(dirname "$0")"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN is empty. Restart the runtime so the connection env loads, then re-run." >&2
  exit 1
fi

API="https://api.github.com"
AUTH="Authorization: Bearer ${GITHUB_TOKEN}"

# 1. Who am I?
USER_LOGIN=$(curl -fsSL -H "$AUTH" "$API/user" | python3 -c "import sys,json;print(json.load(sys.stdin)['login'])")
echo "Authenticated as: $USER_LOGIN"

# 2. Personalize repo URLs in the source with the real username.
grep -rl "jianhuaMr" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null \
  | xargs -r sed -i "s/jianhuaMr/${USER_LOGIN}/g"
if ! git diff --quiet; then
  git add -A
  git commit -q -m "chore: set repository URLs to ${USER_LOGIN}"
  echo "Committed username substitution."
fi

# 3. Create the repo (idempotent: ignore 'already exists').
REPO_DESC="Tiny, zero-dependency, fully-typed Shippo client for Node & edge runtimes. Rates, labels, and tracking in three calls."
CREATE_CODE=$(curl -s -o /tmp/repo.json -w "%{http_code}" -X POST -H "$AUTH" \
  "$API/user/repos" \
  -d "{\"name\":\"shippo-lite\",\"description\":$(python3 -c "import json,sys;print(json.dumps(sys.argv[1]))" "$REPO_DESC"),\"private\":false,\"has_issues\":true,\"has_wiki\":false}")
if [ "$CREATE_CODE" = "201" ]; then
  echo "Repo created."
elif grep -q "already exists" /tmp/repo.json 2>/dev/null; then
  echo "Repo already exists — will push to it."
else
  echo "Repo create returned HTTP $CREATE_CODE:"; cat /tmp/repo.json; exit 1
fi

# 4. Add topics (improves discoverability / looks maintained).
curl -s -o /dev/null -X PUT -H "$AUTH" -H "Accept: application/vnd.github.mercy-preview+json" \
  "$API/repos/${USER_LOGIN}/shippo-lite/topics" \
  -d '{"names":["shippo","shipping","shipping-label","tracking","typescript","zero-dependency","ecommerce","logistics","edge","carrier"]}' || true

# 5. Push.
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${USER_LOGIN}/shippo-lite.git"
git branch -M main
git push -u origin main
# Strip the token back out of the stored remote URL.
git remote set-url origin "https://github.com/${USER_LOGIN}/shippo-lite.git"

echo ""
echo "Done. Repo: https://github.com/${USER_LOGIN}/shippo-lite"
