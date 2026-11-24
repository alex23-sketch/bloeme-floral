#!/bin/bash
# Deploy the Business PRO storefront to Cloudflare Pages.
# Usage: API_URL=https://bloeme-api.onrender.com/api/v1 ./scripts/deploy-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

API_URL="${API_URL:-}"
if [ -z "$API_URL" ]; then
  echo "Set API_URL, e.g. API_URL=https://bloeme-api.onrender.com/api/v1" >&2
  exit 1
fi

VITE_APP_MODE=business-pro VITE_API_URL="$API_URL" npm run build
npx wrangler pages deploy dist --project-name bloeme-floral --branch main
