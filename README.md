# Inventory Management System (SCRUM-2)

A comprehensive, production-ready inventory management system built with FastAPI (Python 3.11) and React 18 (Vite / Tailwind CSS).

## Server (Backend)

### Requirements & Setup
- Python 3.11+
- Virtual Environment

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Environment Variables
Environment variables can be set in `.env.example` at the repository root or exported:
- `DATABASE_URL`: Connection string (default: `sqlite:////tmp/app.db`)
- `JWT_SECRET_KEY`: Secret key for JWT signing
- `ALLOWED_ORIGINS`: Comma-separated list of CORS origins (default: `http://localhost:5173,http://localhost:3000`)

### Running Backend Tests
```bash
pytest server/tests -v
```

### Running Development Server
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs are available at `http://localhost:8000/docs` or `http://localhost:8000/api/v1/openapi.json`.

---

## Client (Frontend)

### Setup & Run
```bash
cd client
npm install
npm run dev
```
The frontend dev server runs on `http://localhost:5173`.

---

## Full-Stack Local Development
1. Start the backend on port 8000: `uvicorn server.main:app --port 8000`
2. Start the frontend on port 5173: `cd client && npm run dev`
3. Access the dashboard at `http://localhost:5173`.

### Pre-seeded Test Accounts
- Regular User: `test@example.com` / `testpassword`
- Admin User: `admin@example.com` / `adminpassword`
