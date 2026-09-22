# Sales Order ETL Pipeline (Cloud Run Job)

Production-grade ETL pipeline containerized with Python 3.11 for execution as a serverless GCP Cloud Run Job.

## Overview
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`)
- **Transformations**:
  - Whitespace trimming and null standardization across text fields.
  - Type casting (`order_id` to INT64, `amount` to FLOAT64, `created_at` to UTC ISO 8601 TIMESTAMP).
  - Business key deduplication on `order_id` (retaining latest record with highest completeness).
  - Date derivation (`order_date` partition key) and audit metadata injection (`ingested_at`).
- **Target**: Google BigQuery partitioned table (`analytics.harshada-test1`, partitioned by `order_date`).
- **Orchestration / Compute**: GCP Cloud Run Jobs (zero idle server cost, pay-per-execution, deterministic exit codes).

## Architecture & File Structure
```text
├── Dockerfile                      # Production container spec for Cloud Run Job
├── env.deploy.json                 # Deployment environment variables
├── main.py                         # Standalone ETL pipeline entrypoint
├── requirements.txt                # Python dependencies
├── transformation_spec.json        # Formal source-to-target mapping contract
├── schemas/
│   ├── sales_order_schema.json     # BigQuery JSON schema
│   └── harshada-test1_schema.json  # Target table schema
├── sql/
│   └── ddl/
│       ├── create_sales_orders_table.sql
│       └── harshada-test1.sql
├── src/
│   ├── __init__.py
│   ├── ingestion/
│   │   ├── __init__.py
│   │   └── gcs_reader.py           # GCS CSV ingestion module
│   ├── transformation/
│   │   ├── __init__.py
│   │   ├── cleaner.py              # Data cleaning and standardization
│   │   └── deduplicator.py         # Primary key deduplication
│   └── loader/
│       ├── __init__.py
│       └── bigquery_writer.py      # BigQuery partitioned table loader
└── tests/
    ├── __init__.py
    ├── test_cleaner.py
    ├── test_deduplicator.py
    ├── test_gcs_reader.py
    ├── test_bigquery_writer.py
    └── test_integration.py
```

## Running Locally

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Execute Tests
```bash
pytest tests/ -v
```

### 3. Run Pipeline Locally (with GCP ADC)
```bash
export GCP_PROJECT="upbeat-repeater-477110-q6"
export GCS_BUCKET_NAME="sdlc-workspec-store"
export GCS_FILE_PATH="etl/data/raw_sales_data.csv"
export BIGQUERY_DATASET="analytics"
export BIGQUERY_TABLE="harshada-test1"

python main.py
```

## Docker Build & Run
```bash
docker build -t sales-order-etl .
docker run --rm -e GCP_PROJECT="upbeat-repeater-477110-q6" sales-order-etl
```
