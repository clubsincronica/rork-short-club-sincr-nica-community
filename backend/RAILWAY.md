# Deploying `clubsincronica-backend` to Railway

This guide walks through deploying the backend to Railway and migrating the local `sql.js` DB to Postgres.

Prerequisites
- A GitHub repository containing this project (push the `backend/` folder to a branch)
- A Railway account
- Railway CLI (optional)

Steps
1. Push to GitHub
   - Commit and push your changes. Example:
     ```bash
     git add backend
     git commit -m "Backend: prepare Railway deployment"
     git push origin main
     ```

2. Create a Railway project and connect your repo
   - Go to https://railway.app and create a new project.
   - Choose "Deploy from GitHub" and select the repository and branch.
   - Railway will detect a Node app. If it asks for a start command, use `npm start` or the Dockerfile.

3. Add a Postgres plugin
   - In the Railway project dashboard click "Add Plugin" → Postgres.
   - Railway will provision Postgres and provide a `DATABASE_URL` env var.

4. Set environment variables
   - In Railway's Environment variables for the service set:
     - `NODE_ENV=production`
     - `JWT_SECRET` (generate a secret)
     - `DATABASE_URL` (Railway provides this automatically when you add the Postgres plugin)

5. Deploy
   - Trigger a deploy from the Railway UI. Check build logs for errors.

6. Run migration (one-off job)
   - After Postgres is provisioned and the app is deployed, run the migrator to copy data from `clubsincronica.db` into Postgres.
   - If your local DB file (`clubsincronica.db`) contains data you want to import, upload it to the Railway project (or run the migration from your machine pointing `DATABASE_URL` to the Railway DB).
   - To run locally against Railway Postgres, set the `DATABASE_URL` env var and run:
     ```powershell
     $env:DATABASE_URL = "postgres://<user>:<pass>@<host>:<port>/<db>"
     cd backend
     npm ci
     npx ts-node src/scripts/migrate-to-postgres.ts
     ```
  
      - Add the signed URL as a GitHub secret named `DB_DOWNLOAD_URL`.
      - Alternatively, upload the DB to a private Google Cloud Storage (GCS) object and add the following secrets to GitHub Actions:
        - `GCP_SA_KEY`: JSON contents of a GCP service account key (store as secret). The service account needs `roles/storage.objectViewer` on the bucket/object.
        - `GCP_DB_GS_URL`: The GCS URL of the object (e.g., `gs://your-private-bucket/clubsincronica.db`).
  
        The migration workflow supports downloading from GCS using these secrets. It will use `gsutil` to copy the DB into `backend/clubsincronica.db` prior to running the migration.

7. Verify
   - Check the Railway Postgres DB for tables and imported rows.
   - Test the API endpoints (`/health`, `/api/users`, etc.).

Notes
- The project includes a `railway.json` manifest and a `Dockerfile` to help Railway build the service.
- For CI-based deployments you can create a GitHub Actions workflow that uses the Railway CLI or integrate Railway directly via the UI.

If you want, I can create a GitHub Actions workflow that deploys to Railway automatically when a secret `RAILWAY_API_KEY` (or `RAILWAY_TOKEN`) is set in the GitHub repo. Tell me whether you'd like an automated deploy or prefer manual UI deploys.