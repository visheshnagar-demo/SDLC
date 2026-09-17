# Daily Batch Sales Order ETL Pipeline (`SCRUM-300`)

A serverless, daily batch ETL data pipeline packaged as a Google Cloud Run Job. It extracts raw sales order CSV data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and validates records, deduplicates transactions keeping the latest by timestamp, and loads the sanitized dataset into a partitioned and clustered BigQuery table (`analytics.new_sales_orders`).

---

## 1. Architecture Overview

- **Compute & Orchestration**: Ephemeral Google Cloud Run Job triggered on a daily schedule via Cloud Scheduler or manual invocation.
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`).
- **Processing Engine**: Python 3.11 with Pandas, PyArrow, and Pydantic validation.
- **Destination Sink**: Google BigQuery partitioned table `analytics.new_sales_orders` (Day partitioned on `DATE(created_at)`, clustered on `customer_id`, `product_category`).
- **Observability**: Structured JSON logging to stdout, automatically ingested by Cloud Logging.

---

## 2. Directory Layout

```
├── Dockerfile                                 # Container image definition for Cloud Run Job
├── README.md                                  # Pipeline documentation and operational guide
├── env.deploy.json                            # Deployment environment configuration
├── requirements.txt                           # Python dependencies
├── schemas/
│   └── sales_order_schema.json               # BigQuery JSON schema definition
├── sql/
│   └── ddl/
│       └── create_analytics_new_sales_orders.sql # BigQuery DDL
├── server/
│   ├── __init__.py
│   ├── config.py                              # Configuration loader
│   ├── extractor.py                           # GCS data ingestion client
│   ├── loader.py                              # BigQuery table initialization & batch loader
│   ├── main.py                                # CLI and batch execution entrypoint
│   ├── models.py                              # Pydantic data models & telemetry schemas
│   └── transformer.py                         # Data sanitization, deduplication, & validation
└── tests/
    ├── __init__.py
    ├── test_extractor.py
    ├── test_loader.py
    ├── test_pipeline.py
    └── test_transformer.py
```

---

## 3. Configuration & Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | `upbeat-repeater-477110-q6` | GCP Project ID |
| `SOURCE_GCS_URI` | `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv` | Input CSV path in GCS |
| `BIGQUERY_DATASET` | `analytics` | BigQuery target dataset |
| `BIGQUERY_TABLE` | `new_sales_orders` | BigQuery target table |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 4. Local Development & Testing

### 4.1 Prerequisites
- Python 3.11+
- Virtual environment tool (`venv` or `uv`)

### 4.2 Setup
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4.3 Run Unit and Integration Tests
```bash
pytest tests/ -v
```

### 4.4 Local Pipeline Execution
```bash
# Execute with default environment variables
python -m server.main

# Override parameters via CLI
python -m server.main \
  --source-uri "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv" \
  --destination-table "analytics.new_sales_orders" \
  --project-id "upbeat-repeater-477110-q6" \
  --batch-id "manual-run-001"
```

---

## 5. Cloud Run Job Deployment

The container is packaged and deployed as a Cloud Run Job:

```bash
# Build and push container to Google Artifact Registry
gcloud builds submit --tag us-central1-docker.pkg.dev/upbeat-repeater-477110-q6/sdlc-containers/sales-etl-job:latest .

# Deploy Cloud Run Job
gcloud run jobs create sales-etl-job \
  --image us-central1-docker.pkg.dev/upbeat-repeater-477110-q6/sdlc-containers/sales-etl-job:latest \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --set-env-vars "GCP_PROJECT_ID=upbeat-repeater-477110-q6,SOURCE_GCS_URI=gs://sdlc-workspec-store/etl/data/raw_sales_data.csv,BIGQUERY_DATASET=analytics,BIGQUERY_TABLE=new_sales_orders"

# Execute Cloud Run Job
gcloud run jobs execute sales-etl-job --region us-central1 --wait
```
