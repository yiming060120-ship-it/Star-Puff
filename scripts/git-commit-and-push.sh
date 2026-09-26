#!/usr/bin/env bash
set -euo pipefail

# Commit staged logical groups and push

git add package.json microtransaction-api/db.ts
git commit -m "chore(db): add better-sqlite3 and add SQLite DAL for grants/users"

git add microtransaction-api/fulfillment.ts
git commit -m "feat(microtransaction): migrate grants/users persistence to SQLite with transactional apply/revert"

git add microtransaction-api/service.ts
git commit -m "fix(microtransaction): fix Steam API param handling and JSON import assertion"

git add electron/main.cjs
git commit -m "chore(electron): use keytar for secure Gemini API key storage; fallback to config.json"

# optional: commit everything else
git add -A
git commit -m "chore(repo): persistency and security improvements for microtransaction and electron" || true

echo "Pushing..."
git push origin HEAD

echo "Done."