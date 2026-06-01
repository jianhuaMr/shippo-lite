#!/usr/bin/env bash
# Push local commits on main to GitHub. Requires GITHUB_TOKEN (fresh session).
set -euo pipefail
cd "$(dirname "$0")"
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN is empty. Run in a fresh session." >&2
  exit 1
fi
USER_LOGIN=$(curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" https://api.github.com/user | python3 -c "import sys,json;print(json.load(sys.stdin)['login'])")
REPO="${USER_LOGIN}/shippo-lite"
git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
git push origin main
git remote set-url origin "https://github.com/${REPO}.git"
echo "Pushed to https://github.com/${REPO}"
