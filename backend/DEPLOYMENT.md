# Deployment Guide for clubsincronica-backend

This document shows quick steps to deploy to Render or Railway and how to prepare the project for Postgres (production DB) instead of `sql.js`.

Prerequisites
- GitHub repository with the `backend/` folder committed
- Render or Railway account
- Node 18+ runtime

Quick steps (Render)
1. Push the repository to GitHub.
2. Create a new Web Service on Render and connect the GitHub repo.
3. Use the `render.yaml` present in `backend/` to configure the service, or configure through the Render UI:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Environment:
     - `NODE_ENV=production`
     - `DATABASE_URL` (Render will create a Postgres database and set this)
     - `JWT_SECRET` (generated)
4. Deploy and monitor logs in Render dashboard.

Quick steps (Railway)
1. Push the repo to GitHub.
2. Create a new project in Railway and link the repo.
3. Add a Postgres plugin; Railway will provide `DATABASE_URL`.
4. Set environment variables (JWT_SECRET, NODE_ENV).
5. Deploy via Railway and monitor logs.

Notes on database migration
- Current dev uses `sql.js` (file-based SQLite in memory/FS). For production, use Postgres.
- A migration strategy:
  1. Add `pg` and `postgres-client.ts` helper (already added).
  2. Create SQL migration scripts to create tables matching the current schema used in `sql.js`.
  3. On first deploy, run the migration scripts against Postgres (Railway/Render allow running one-off commands).
  4. Optionally copy data from `sql.js` to Postgres by exporting rows and inserting into Postgres during a migration script.

I can prepare migration SQL and a single-file migration utility to copy from the existing `backend/clubsincronica.db` to Postgres if you want — tell me and I'll add it.
