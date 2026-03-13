# Deploy (Vercel + Railway)

This project uses:
- Frontend: Next.js on Vercel
- Backend: FastAPI on Railway
- DB: Railway Postgres

## Important: Cookies + Middleware

Auth cookies must live on the **same origin** as the frontend so `middleware.ts` can read `access_token`.
To achieve this, the frontend calls `/api/v1/...` and Next rewrites proxy requests to Railway.

## Railway (Backend)

1. Create a new Railway project.
2. Add a Postgres database.
3. Deploy from this repo, set root directory to `backend/` (or point the service to `backend/Dockerfile`).
4. Set environment variables on Railway:
   - `ENVIRONMENT=prod`
   - `SECRET_KEY=<random 32+ chars>`
   - `DATABASE_URL=<Railway Postgres URL>`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=lax`
   - `DB_AUTO_CREATE=true` (MVP; later switch to migrations)
5. After deploy, note your backend URL, for example `https://your-app.up.railway.app`

## Vercel (Frontend)

1. Import this repo into Vercel.
2. Set root directory to `frontend/`.
3. Add environment variables on Vercel:
   - `BACKEND_ORIGIN=https://your-app.up.railway.app`
   - (optional for local only) `NEXT_PUBLIC_API_BASE_URL`
4. Deploy.

## Local Dev Using the Proxy (Recommended)

Run backend on `http://127.0.0.1:8000`, set in `frontend/.env.local`:
- `BACKEND_ORIGIN=http://127.0.0.1:8000`

Then the browser always calls `http://localhost:3000/api/v1/...` and cookies stay on `localhost:3000`.

