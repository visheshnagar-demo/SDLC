# Sales Orders ETL Pipeline (PostgreSQL to Google BigQuery)

**Jira Issue**: [SCRUM-288](https://bfsi-na-ai-engineering-v4.atlassian.net/browse/SCRUM-288)  
**Pipeline**: `postgres_to_bigquery_sales_etl`  
**Target Table**: `dev_sales.fct_sales_orders_v1` (Partitioned by `order_date`)

---

## 1. Overview

This production-grade ETL data pipeline extracts sales order transaction records from PostgreSQL (`raw_sales_orders`), validates data quality and cleanses invalid records (filtering out records with missing/non-positive amounts and invalid email formats), and loads the clean dataset into a partitioned BigQuery analytics table (`dev_sales.fct_sales_orders_v1`).

### Architecture & Capabilities:
- **Source**: PostgreSQL `raw_sales_orders` with batch extraction and exponential retry backoff.
- **Cleansing & Validation**: Strict RFC-5322 email regex verification, positive numerical amount validation (`amount > 0` and non-null), and ISO-8601 date checking.
- **Quarantine & Audit**: Dead-letter logging of rejected rows with standardized error codes (`ERR_MISSING_OR_INVALID_AMOUNT`, `ERR_INVALID_EMAIL_FORMAT`, `ERR_MISSING_ORDER_ID`, `ERR_INVALID_ORDER_DATE`).
- **Target**: Google BigQuery `dev_sales.fct_sales_orders_v1` partitioned daily by `order_date` and clustered by `customer_id, status`.
- **Packaging**: Containerized for Google Cloud Run Jobs (zero-idle overhead), standalone CLI, FastAPI REST service, and Apache Airflow DAG.

---

## 2. Directory Structure

```
├── Dockerfile                          # Cloud Run Job Docker container specification
├── README.md                           # Documentation & execution runbook
├── requirements.txt                    # Project dependencies
├── dags/
│   └── sales_orders_etl_dag.py         # Airflow / Cloud Composer DAG
├── pipeline/
│   └── run_sales_etl.py                # Cloud Run Job standalone runner script
├── schemas/
│   ├── fct_sales_orders_v1_schema.json # BigQuery JSON table schema
│   └── sales_order_schema.json         # BigQuery field definitions
├── server/
│   ├── database.py                     # SQLAlchemy database session & engine manager
│   ├── main.py                         # FastAPI REST application & health checks
│   ├── models.py                       # SQLAlchemy & Pydantic data schemas
│   ├── pipeline/
│   │   ├── cleanser.py                 # Sales data cleansing & RFC validation logic
│   │   ├── extractor.py                # PostgreSQL batch extractor with retries
│   │   ├── loader.py                   # BigQuery partitioned table loader
│   │   ├── main.py                     # ETL orchestration engine & CLI
│   │   └── quarantine.py               # Quarantine manager & audit logger
│   └── requirements.txt
├── sql/
│   └── ddl/
│       └── fct_sales_orders_v1.sql     # BigQuery DDL with partitioning & clustering
└── tests/
    └── test_pipeline.py                # Comprehensive pytest suite (unit + E2E + API)
```

---

## 3. Environment Configuration

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `POSTGRES_DB_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/salesdb` |
| `GCP_PROJECT_ID` | Google Cloud Project ID | `upbeat-repeater-477110-q6` |
| `BIGQUERY_DATASET` | Target BigQuery dataset | `dev_sales` |
| `BIGQUERY_TABLE` | Target BigQuery table | `fct_sales_orders_v1` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

---

## 4. Local Execution & Testing

### 4.1 Run Validation Tests
```bash
pytest tests/ -v
```

### 4.2 Run Pipeline via CLI
```bash
# Dry run mode
python -m server.pipeline.main --dry-run

# Full execution
python -m server.pipeline.main --source-table raw_sales_orders --dataset dev_sales --table fct_sales_orders_v1
```

### 4.3 Run Standalone Job Entrypoint
```bash
python -m pipeline.run_sales_etl
```

### 4.4 Run FastAPI REST Service
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: `GET http://localhost:8000/health`
- Pipeline Info: `GET http://localhost:8000/api/v1/pipeline/info`
- Trigger ETL: `POST http://localhost:8000/api/v1/pipeline/run`

---

## 5. Deployment as Cloud Run Job

Build and deploy the container image directly to Google Cloud Run Jobs:
```bash
gcloud builds submit --tag gcr.io/upbeat-repeater-477110-q6/sales-etl:latest .
gcloud run jobs create sales-etl-job \
    --image gcr.io/upbeat-repeater-477110-q6/sales-etl:latest \
    --region us-central1 \
    --set-env-vars POSTGRES_DB_URL="postgresql://...",GCP_PROJECT_ID="upbeat-repeater-477110-q6"
gcloud run jobs execute sales-etl-job --region us-central1
```
