# Daily Batch Sales ETL Pipeline (SCRUM-300)

Daily batch ETL pipeline deployed as a Google Cloud Run Job that ingests raw sales order CSV files from Google Cloud Storage, cleans and deduplicates records, and loads them into a date-partitioned Google BigQuery table `analytics.new_sales_orders`.

## Architecture Overview

1. **Extractor (`server/extractor.py`)**: Ingests sales order CSV files from GCS (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`).
2. **Transformer (`server/transformer.py`)**: Trims whitespace, casts and validates types, quarantines invalid rows, and deduplicates records by `order_id`.
3. **Loader (`server/loader.py`)**: Auto-creates and loads cleaned records into date-partitioned BigQuery table `analytics.new_sales_orders`.
4. **Runner / Entrypoint (`server/main.py`)**: CLI and batch job runner for Cloud Run Job execution.

## Requirements & Setup

### Environment Variables
- `GCP_PROJECT`: Google Cloud Platform project ID
- `GCS_SOURCE_URI`: GCS URI to source CSV file (default: `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`)
- `BIGQUERY_DATASET`: Target BigQuery dataset (default: `analytics`)
- `BIGQUERY_TABLE`: Target BigQuery table (default: `new_sales_orders`)
- `PARTITION_FIELD`: Date partitioning column (default: `created_at`)

### Local Installation & Testing
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest
```

### Running the Pipeline
```bash
python -m server.main --gcs-uri gs://sdlc-workspec-store/etl/data/raw_sales_data.csv
```

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

