# SCRUM-287: Sales Data ETL Pipeline (PostgreSQL to Partitioned BigQuery)

## Overview
This production-grade ETL pipeline extracts sales transaction data from the PostgreSQL `raw_sales_orders` table, applies data cleansing rules (filtering out records with missing/non-positive amounts or invalid email formats), and loads the curated records into Google BigQuery analytics table `fct_sales_orders` partitioned daily by `order_date` and clustered by `order_id` and `customer_email`.

## Key Features
- **Data Cleansing**:
  - Drops rows with `NULL`, empty, or negative sales `amount`.
  - RFC 5322 regex validation for `customer_email`.
  - Normalizes email casing and trims whitespaces.
- **Dead-Letter Queue (DLQ)**: Stores rejected records with specific reason codes into `quarantine_sales_orders` for auditability.
- **Partitioning & Clustering**: Day-level partitioning on `order_date` with clustering on `order_id` and `customer_email` in BigQuery table `sales_analytics.fct_sales_orders`.
- **Auto-Boot Serverless Execution**: Packaged as a Cloud Run service (`app.py` / `Dockerfile`) that auto-runs the ETL task on container boot, alongside REST API endpoints (`/api/v1/etl/jobs/sales-orders/run`, `/api/v1/etl/jobs/sales-orders/status/{job_id}`).
- **Orchestration**: Includes Airflow DAG (`dags/sales_orders_dag.py`) and standalone runner (`pipeline/run_sales_orders.py`).

## Architecture & Schema
- **Source**: PostgreSQL `raw_sales_orders` table
- **Target**: BigQuery `upbeat-repeater-477110-q6.sales_analytics.fct_sales_orders`
  - Partition field: `order_date` (DAY)
  - Clustering fields: `order_id`, `customer_email`

## Local Development & Testing

### 1. Environment Setup
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Tests
```bash
pytest
```

### 3. Run Server Locally
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
# Or run auto-boot container entrypoint
python app.py
```

### 4. Trigger Standalone Pipeline
```bash
python pipeline/run_sales_orders.py --date 2026-05-18
```

## API Endpoints
- `POST /api/v1/etl/jobs/sales-orders/run` — Trigger ETL pipeline batch run
- `GET /api/v1/etl/jobs/sales-orders/status/{job_id}` — Query execution status and metric breakdown
- `GET /api/v1/health` — Health check endpoint
