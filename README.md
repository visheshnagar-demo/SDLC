# Daily Batch Sales Order ETL Pipeline

A resilient, scalable daily batch ETL data pipeline designed for containerized execution as a **GCP Cloud Run Job**. The pipeline ingests daily sales order CSV files from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and deduplicates the records, and loads them into a partitioned BigQuery table `analytics.new_sales_orders`.

## Architecture & Workflow

```
[ GCS Bucket ]
      │
      ▼ (gs://sdlc-workspec-store/etl/data/raw_sales_data.csv)
┌──────────────────────────────────────────────┐
│  Cloud Run Job (Batch Processing Engine)     │
│                                              │
│  1. Extractor (GCS CSV Ingestion)            │
│  2. Transformer (Clean, Validate, Dedup)     │
│  3. Loader (BigQuery Partitioned Loader)     │
└──────────────────────────────────────────────┘
      │
      ▼
[ BigQuery: analytics.new_sales_orders ] (PARTITION BY DATE(created_at))
```

## Features & Acceptance Criteria Compliance

1. **GCS CSV Ingestion**:
   - Ingests sales order CSV files from `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv` using the official `google-cloud-storage` SDK.
   - Missing file or empty CSV triggers structured logging and exits gracefully without crashing.
2. **Data Cleaning & Deduplication**:
   - Strips leading/trailing whitespace across string columns.
   - Validates data types, ensures positive quantities and prices, and parses ISO timestamps.
   - Quarantines invalid records and deduplicates based on unique `order_id`.
3. **Partitioned BigQuery Loading**:
   - Loads clean records into `analytics.new_sales_orders` with Day partitioning on `created_at` and clustering on `customer_id, product_id`.
4. **Cloud Run Job Deployment**:
   - Containerized with Docker and executed via standard CLI: `python -m server.main`.

## Project Structure

```
.
├── Dockerfile
├── README.md
├── requirements.txt
├── server/
│   ├── __init__.py
│   ├── config.py
│   ├── extractor.py
│   ├── loader.py
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   ├── schemas/
│   │   └── sales_order_schema.json
│   ├── sql/
│   │   └── ddl/
│   │       └── create_analytics_new_sales_orders.sql
│   └── transformer.py
└── tests/
    ├── __init__.py
    ├── test_extractor.py
    ├── test_loader.py
    ├── test_main.py
    └── test_transformer.py
```

## Environment Configuration

Copy `.env.example` or export the required environment variables:

| Variable | Description | Default |
|---|---|---|
| `GCS_SOURCE_URI` | GCS path to raw sales CSV | `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv` |
| `GCP_PROJECT` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `BQ_DATASET` | Destination BigQuery dataset | `analytics` |
| `BQ_TABLE` | Destination BigQuery table | `new_sales_orders` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Local Development & Testing

### 1. Setup Virtual Environment

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Test Suite

```bash
pytest tests/ -v
```

### 3. Run Pipeline Locally

```bash
python -m server.main --gcs-uri "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv"
```

## Docker Container Build & Cloud Run Job Deployment

```bash
# Build Docker image
docker build -t gcr.io/upbeat-repeater-477110-q6/sales-etl-job:latest .

# Deploy as Cloud Run Job
gcloud run jobs create sales-etl-job \
    --image gcr.io/upbeat-repeater-477110-q6/sales-etl-job:latest \
    --region us-central1 \
    --set-env-vars GCP_PROJECT=upbeat-repeater-477110-q6,BQ_DATASET=analytics,BQ_TABLE=new_sales_orders
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

