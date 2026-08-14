PR: Microtransaction hardening and security improvements

Summary:
- Migrate microtransaction persistence to SQLite (transactional grants/users)
- Add DB DAL `microtransaction-api/db.ts` using `better-sqlite3`
- Add keytar-backed secure storage for Gemini API Key in Electron
- Fix Steam API GET/POST parameter construction and JSON import assertions
- Add daily reconciliation scheduler in `server.ts` to auto-revoke refunded/chargeback orders
- Add CI workflow for linting and basic checks
- Add handover documentation and commit script

Testing:
- `npm install` (note `better-sqlite3` native build)
- `npm run lint` (TypeScript check)
- `npm run dev` and `npm run electron:dev` for local verification

Rollback:
- Revert PR or run db migration scripts to export/import `grants` and `users` tables

Notes:
- For production, migrate SQLite to Postgres and add backup/replication.
