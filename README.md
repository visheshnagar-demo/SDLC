# Cattle & Dairy Farm Management Platform

A centralized, full-stack cattle and dairy farm operations platform supporting RFID ear tag profiling, daily morning/evening milk logging with automated mastitis (>30% drop) detection, 283-day breeding and gestation lifecycle tracking, dynamic TMR feed ration allocation (based on lactation stage, milk yield, and BCS) and inventory monitor (5-day threshold alerts), veterinary treatment and milk withholding enforcement, routine visit scheduling, and executive herd analytics dashboards.

## System Architecture

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite (Local / Test) & PostgreSQL (Production)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Deployment**: Google Cloud Run & Cloud SQL

---

## Full-Stack Local Development

### 1. Server Setup & Execution

```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive OpenAPI documentation is at `http://localhost:8000/docs`.

### 2. Running Backend Tests

```bash
cd server
pytest
```

### 3. Frontend Setup & Execution

```bash
cd client
npm install
npm run dev
```

The frontend development server runs at `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

---

## API Endpoints Summary

- **Cattle & RFID**: `GET/POST /api/v1/cattle`, `GET/PUT/DELETE /api/v1/cattle/{id}`
- **Milking Operations**: `GET/POST /api/v1/milk-logs`, `GET /api/v1/milk-logs/summary`
- **Breeding & Reproduction**: `GET/POST /api/v1/breeding-records`, `GET/PUT/DELETE /api/v1/breeding-records/{id}`
- **Feed & Rations**: `GET/POST /api/v1/feed-rations`, `POST /api/v1/feed-rations/calculate-allocation`, `GET /api/v1/feed-rations/cow/{id}/allocation`, `GET/POST /api/v1/feed-inventory`
- **Health & Veterinary**: `GET/POST /api/v1/health-records`, `GET /api/v1/health-records/active-withdrawals`, `POST /api/v1/health-records/verify-bulk-milk`, `POST /api/v1/health-records/schedule-visit`, `GET /api/v1/health-records/schedules`
- **Analytics & Dashboard**: `GET /api/v1/analytics/dashboard`

## Server

### Prerequisites
- Python 3.9+
- pip and venv

### Setup

1. Create and activate virtual environment:
```bash
python -m venv server/.venv
# On Windows:
server\.venv\Scripts\activate
# On macOS/Linux:
source server/.venv/bin/activate
```

2. Install dependencies:
```bash
cd server
pip install -r requirements.txt
cd ..
```

### Running Tests
```bash
cd server
python -m pytest -v
cd ..
```

### Starting the Development Server
```bash
# Run from the repo root so that `from server.X` imports resolve correctly
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Full-Stack Local Development

To run both backend and frontend together locally:

### 1. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Start the Backend (Terminal 1)
```bash
python -m venv server/.venv
source server/.venv/bin/activate  # On Windows: server\.venv\Scripts\activate
pip install -r server/requirements.txt
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API: `http://localhost:8000` | API Docs: `http://localhost:8000/docs`

### 3. Start the Frontend (Terminal 2)
```bash
cd client
npm install
npm run dev
```
Frontend: `http://localhost:5173`

The frontend connects to the backend API at `http://localhost:8000` by default via the `VITE_API_BASE_URL` environment variable.

### 4. Test Credentials
If the app has authentication, the backend seeds ready-to-use accounts on startup
(idempotent). These are guaranteed logged-in-able — every activation/verification
gate (`is_active`, `is_verified`, `email_verified`, `disabled`) is set to the
permissive value, so no manual DB step is needed:
- **Regular user** — Email: `test@example.com`, Password: `testpassword`
- **Admin user** (only when the app has roles/RBAC) — Email: `admin@example.com`, Password: `adminpassword`, role: `admin`

Passwords are stored hashed with the app's own hashing utility (never in plaintext).

### Port Reference
| Service  | Port | URL                        |
|----------|------|----------------------------|
| Backend  | 8000 | http://localhost:8000      |
| Frontend | 5173 | http://localhost:5173      |
| API Docs | 8000 | http://localhost:8000/docs |

