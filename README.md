# Sales Data ETL Pipeline (SCRUM-290)

An enterprise-grade batch ETL pipeline service built with Python 3.11 and FastAPI. It extracts raw sales transactions from PostgreSQL (`raw_sales_orders`), filters invalid records (missing or non-positive amounts, invalid email formats), transforms the data, and loads the sanitized records into Google BigQuery partitioned by `order_date` (`fct_sales_orders`).

---

## 1. Architecture Overview

- **Source Database:** PostgreSQL (`raw_sales_orders`)
- **Cleansing & Validation:**
  - Drops records with missing, null, or non-positive `amount` (`MISSING_OR_NULL_AMOUNT`)
  - Drops records with malformed email addresses failing RFC 5322 regex (`INVALID_EMAIL_FORMAT`)
- **Data Warehouse Target:** Google BigQuery (`sales_analytics.fct_sales_orders`)
  - Partitioning: `DAY` partition on `order_date`
  - Clustering: Clustered by `customer_id`, `status`
- **Execution & Orchestration:**
  - REST API endpoint (`POST /api/v1/pipeline/run`)
  - Containerized deployment on GCP Cloud Run
  - Optional Apache Airflow / Cloud Composer DAG (`dags/sales_data_etl_pipeline.py`)

---

## 2. Directory Structure

```
.
├── server/
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── extractor.py        # PostgreSQL batch extractor with retry logic
│   │   ├── validator.py        # Data cleansing & email/amount validation rules
│   │   ├── transformer.py      # Schema casting and UTC normalization
│   │   ├── loader.py           # Partitioned BigQuery loader
│   │   └── logger.py           # Structured logging and audit events
│   ├── config.py               # Pydantic Settings
│   ├── database.py             # SQLAlchemy session & connection pooling
│   ├── models.py               # Raw sales order ORM entity
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── main.py                 # FastAPI service entrypoint & API endpoints
│   ├── requirements.txt        # Backend dependencies
│   └── Dockerfile              # Production multi-stage Dockerfile
├── dags/
│   └── sales_data_etl_pipeline.py  # Airflow DAG
├── schemas/
│   └── fct_sales_orders_schema.json # BigQuery JSON Schema
├── sql/
│   └── ddl/
│       └── fct_sales_orders.sql     # BigQuery DDL
├── tests/
│   ├── test_health.py          # Health check endpoint tests
│   ├── test_extractor.py       # Extractor unit tests
│   ├── test_validator.py       # Data validation & filtering tests
│   ├── test_loader.py          # BigQuery loader unit tests
│   └── test_pipeline.py        # End-to-end ETL pipeline tests
├── requirements.txt            # Root dependencies
├── Dockerfile                  # Container definition exposing port 8080
└── README.md
```

---

## 3. Local Development & Testing

### Installation

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running Tests

```bash
pytest tests/ -v
```

### Running Service Locally

```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 4. API Reference

### Health Check
- **Endpoint:** `GET /api/v1/health`
- **Response:**
  ```json
  {
    "status": "healthy",
    "database_connected": true,
    "bigquery_accessible": true
  }
  ```

### Trigger ETL Pipeline Run
- **Endpoint:** `POST /api/v1/pipeline/run`
- **Request Body:**
  ```json
  {
    "start_date": "2026-05-01",
    "end_date": "2026-05-31",
    "batch_size": 1000,
    "force_reload": false
  }
  ```
- **Response:**
  ```json
  {
    "status": "COMPLETED",
    "job_id": "etl-job-c4a1617a-5fe8-4443-855f-cbfca961c0de",
    "start_time": "2026-09-16T12:00:00Z",
    "end_time": "2026-09-16T12:00:02Z",
    "duration_seconds": 2.14,
    "metrics": {
      "extracted_count": 1000,
      "filtered_missing_amount": 35,
      "filtered_invalid_email": 15,
      "total_filtered": 50,
      "loaded_count": 950
    }
  }
  ```

---

## 5. Deployment

Build and run with Docker:

```bash
docker build -t sales-etl-pipeline:latest .
docker run -p 8080:8080 sales-etl-pipeline:latest
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

