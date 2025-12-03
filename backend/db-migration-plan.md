# DB Migration Plan: sql.js -> Postgres

Goal: Move from file-based `sql.js` DB to a managed Postgres instance for production (Render/Railway).

Steps:
1. Inspect `src/models` to enumerate table schemas used by sql.js.
2. Create migration SQL files (e.g., `migrations/001-init-schema.sql`) that create the same tables in Postgres.
3. Add `pg` and the `postgres-client.ts` file (done).
4. Add a migration runner script `scripts/migrate-to-postgres.ts` which:
   - Opens `clubsincronica.db` using sql.js.
   - Selects all rows from existing tables.
   - Inserts them into Postgres using `postgres-client.ts`.
5. Test locally by setting `DATABASE_URL` to a local Postgres and running the migrator.
6. Deploy to Render/Railway and run the migrator there (one-off job) to import legacy data.

Notes:
- If you have no existing production data, you can skip the import and just run the migration SQL on the Postgres DB.
- I can implement the migration script if you want — it requires access to the `clubsincronica.db` file and the schema used by `sql.js` (I can read `src/models` to produce it).
