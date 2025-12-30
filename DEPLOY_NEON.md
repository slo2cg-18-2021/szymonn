Deployment steps for Neon (Postgres) + Vercel

1) Set DATABASE_URL in Vercel
   - Go to your Vercel project settings -> Environment Variables
   - Add variable `DATABASE_URL` with the Neon connection string you provided.
   - Add to both Preview and Production as needed.

2) Create tables in Neon
   - Open Neon dashboard SQL editor (or use psql with `DATABASE_URL`)
   - Run the SQL from `sql/schema_neon.sql` (creates `users` and `products`).

3) Create admin user (choose one)
   A) Locally (recommended):
      - Install dependencies: `npm install pg bcryptjs`
      - Export DATABASE_URL in your shell (use your full Neon URL):
        ```bash
        export DATABASE_URL='postgresql://neondb_owner:...'
        node scripts/create_admin_local.js maziarzstyl_mag '/tbK8/Nu1G@z4'
        ```
   B) Temporarily via serverless endpoint (remove after use):
      - Deploy to Vercel with `api/create_admin.ts` included.
      - POST to `https://<your-vercel-app>/api/create_admin` with JSON { username, password }
      - Remove `api/create_admin.ts` after success to avoid leaving a writable endpoint.

4) Deploy the frontend and API
   - Set `DATABASE_URL` in Vercel as above.
   - Push the repo to GitHub and Vercel will build/deploy. The serverless functions live under `/api/*`.

5) Configure frontend
   - Ensure frontend calls `/api/products` relative to the same domain (that's the default).
   - If you host frontend separately, set `VITE_API_URL` to your Vercel domain.

6) Clean up
   - Remove `api/create_admin.ts` after creating the admin (important for security).
   - Do not commit real `.env` files with credentials.
