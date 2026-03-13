# ProjectAnalysisDailySpendmoney

Daily spending tracker + analytics + simple ML forecast.

## Dev setup (Windows)

### 1) Backend (FastAPI)

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.

### 2) Frontend (Next.js)

```bat
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- Auth uses httpOnly cookies (`access_token`, `refresh_token`) issued by the backend.
- For production, set HTTPS and rotate `SECRET_KEY`.
