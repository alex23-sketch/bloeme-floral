#!/bin/bash
set -e
cd /Users/admin/Projects/WebsiteTemplates/florist-premium-01
python3 -c "from pathlib import Path; p=Path('.env'); s=p.read_text(); s='\n'.join(('TRUSTED_ORIGINS=https://tool-targets-norfolk-thru.trycloudflare.com' if x.startswith('TRUSTED_ORIGINS=') else x) for x in s.splitlines())+'\n'; p.write_text(s)"
docker compose up -d --force-recreate api
sleep 5
curl -sS https://words-welcome-taxation-saving.trycloudflare.com/health
curl -sS https://words-welcome-taxation-saving.trycloudflare.com/api/v1/products > "$TMPDIR/public-products.json"
python3 -c "import json; d=json.load(open('$TMPDIR/public-products.json')); print('public_products',len(d))"
