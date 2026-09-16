# Sales Orders Batch ETL Data Pipeline

Daily batch ETL data pipeline packaged as a Google Cloud Run Job. Ingests sales order CSV exports from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and deduplicates records, and loads them into a partitioned BigQuery table `analytics.sales_orders`.

---

## 1. Architecture Overview

- **Compute**: Google Cloud Run Job (ephemeral batch execution, zero idle server cost).
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`).
- **Engine**: Python 3.11 with Pandas & PyArrow.
- **Target Sink**: Google Cloud BigQuery (`analytics.sales_orders`).
  - **Partitioning**: Daily on `DATE(created_at)`.
  - **Clustering**: `customer_id`, `order_status`.
- **Deduplication Strategy**: Chronologically sorts by `created_at` (ascending) and preserves the latest record for each unique `order_id` (`keep='last'`).

---

## 2. Directory Structure

```
├── Dockerfile                   # Multi-stage production container for Cloud Run Job
├── env.deploy.json              # Deployment environment variables for DevOps agent
├── requirements.txt             # Project runtime dependencies
├── README.md                    # Project documentation
├── .env.example                 # Example local environment variables
├── schemas/
│   └── sales_orders_schema.json # Target BigQuery table schema
├── sql/
│   └── ddl/
│       └── sales_orders.sql     # Target BigQuery table DDL
├── server/
│   ├── __init__.py
│   ├── main.py                  # Pipeline entrypoint and CLI runner
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── extractor.py         # GCS extractor with GCSFileReader
│   │   ├── transformer.py       # Cleansing & deduplication logic
│   │   └── loader.py            # BigQuery partition & cluster loader
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── sales_order.py       # Pydantic data models & BigQuery schema mapping
│   ├── sql/
│   │   └── ddl/
│   │       └── sales_orders.sql # DDL reference
│   └── tests/
│       ├── __init__.py
│       └── test_etl.py          # Unit & integration tests
└── tests/
    ├── __init__.py
    ├── conftest.py              # Test harness and execution environment support
    └── test_sales_orders_pipeline.py # Pytest test suite for validation gate
```

---

## 3. Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GCS_SOURCE_URI` | `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv` | Source CSV file location in Cloud Storage |
| `GCP_PROJECT_ID` | `upbeat-repeater-477110-q6` | GCP Project ID hosting BigQuery |
| `BIGQUERY_DATASET` | `analytics` | BigQuery target dataset |
| `BIGQUERY_TABLE` | `sales_orders` | BigQuery target table name |
| `BIGQUERY_LOCATION` | `us-central1` | GCP region for dataset / table |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 4. Local Execution & Testing

### Running Tests
```bash
pytest tests/ -v
# or
pytest server/tests/ -v
```

### Running ETL Locally
```bash
python -m server.main \
  --source-uri gs://sdlc-workspec-store/etl/data/raw_sales_data.csv \
  --project-id upbeat-repeater-477110-q6 \
  --dataset analytics \
  --table sales_orders
```

---

## 5. Cloud Run Job Deployment

The container is built from the root `Dockerfile` and deployed to Cloud Run Jobs via Harness CI/CD.
When executed, the job starts, performs ingestion, cleansing, deduplication, and BigQuery load, logs execution metrics, and exits with status `0` upon success or `1` upon failure.
