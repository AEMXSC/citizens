#!/usr/bin/env bash
# Upload the Citizens homepage, nav, and footer to DA (da.live) for testing.
# Requires a valid DA token at ~/.aem/da-token.json (refresh via da.live login).
# Usage: bash upload-to-da.sh
set -euo pipefail

ORG=AEMXSC
REPO=citizens
DIR="$(cd "$(dirname "$0")" && pwd)"

TOKEN=$(node -e "const t=JSON.parse(require('fs').readFileSync(process.env.HOME+'/.aem/da-token.json','utf8')); if(t.expires_at<=Date.now()){console.error('DA token expired — refresh da.live login first'); process.exit(1);} process.stdout.write(t.access_token)")

for f in index nav footer; do
  curl -sS -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -F "data=@${DIR}/${f}.html;type=text/html" \
    "https://admin.da.live/source/${ORG}/${REPO}/${f}.html" \
    -w "${f}.html -> %{http_code}\n" -o /dev/null
done

echo "Done. Preview: https://admin.hlx.page/preview/${ORG}/${REPO}/main/ then view https://main--${REPO}--${ORG}.aem.page/"
