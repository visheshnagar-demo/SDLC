# SDLC Project - Payment Gateway & Cloud SQL to BigQuery ETL Pipeline

## Overview
This repository contains a full-stack system consisting of a Payment Gateway backend service and an automated ETL pipeline that extracts data from Google Cloud SQL PostgreSQL, cleans and validates records, and loads them into Google BigQuery.

### ETL Pipeline Components (SCRUM-364)
- **Source Database:** Google Cloud SQL PostgreSQL
  - Instance: `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`
  - Database: `postgres`
  - User: `559906504681-compute@developer` (IAM mTLS authentication via Cloud SQL Python Connector)
  - Source Table: `test_data`
- **Data Transformations:**
  - Leading/trailing whitespace stripping on text fields
  - Standardized null/sentinel value normalization (`""`, `"N/A"`, `"null"`, `"None"` -> `NULL`)
  - Duplicate record elimination
  - Type casting (timestamps to UTC ISO-8601, numeric amounts to float)
  - Injection of `_etl_loaded_at` audit timestamp
- **Target Data Warehouse:** Google BigQuery
  - Project: `upbeat-repeater-477110-q6`
  - Dataset: `analytics`
  - Target Table: `postgres_test2`

---

### Prerequisites
- Python 3.11+
- pip / virtualenv

### 1. Backend Installation
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure appropriate variables:
```bash
cp .env.example .env
```

### 3. Running the Server
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Running the ETL Pipeline Manually
```bash
python -m server.etl_main
```

### 5. Running the Test Suite
```bash
pytest -v
```

---

## API Endpoints

### ETL Job Endpoints
- `POST /api/v1/etl/jobs/run`: Trigger on-demand ETL batch execution.
- `GET /api/v1/etl/jobs/status`: Get latest execution status and metrics.

### Payment Gateway Endpoints
- `POST /api/v1/payments/process`: Process payment transaction.
- `POST /api/v1/refunds/request`: Submit refund request.
- `GET /api/v1/audit/logs`: Query audit logs.
- `GET /health`: Health check.

---

## Full-Stack Local Development
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:5173`
- Default Test Credentials (if auth is enabled):
  - User: `test@example.com` / `testpassword`
  - Admin: `admin@example.com` / `adminpassword`

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

