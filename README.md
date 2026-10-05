# Sales ETL Pipeline (SCRUM-387)

Production-grade ETL pipeline containerized as a Google Cloud Run Job. Ingests raw sales order CSV files from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and sanitizes the records, deduplicates transactions by `order_id`, and loads the transformed dataset into a partitioned BigQuery table (`analytics.aarchi_gcs_test1`).

---

## 1. Architecture Overview

- **Orchestration / Compute**: Google Cloud Run Job (Batch containerized execution).
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`).
- **Processing**: Python 3.11 with Pandas / PyArrow (vectorized data cleaning and deduplication).
- **Destination**: Google BigQuery (`analytics.aarchi_gcs_test1`), partitioned by `order_date` (DAY) and clustered by `order_id`, `customer_id`, `order_status`.
- **Telemetry**: Structured JSON logs emitted directly to GCP Cloud Logging.

---

## 2. Target Schema (`analytics.aarchi_gcs_test1`)

| Field Name | Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `order_id` | `INTEGER` | `REQUIRED` | Unique Order Identifier |
| `customer_id` | `STRING` | `NULLABLE` | Customer reference identifier |
| `customer_name` | `STRING` | `NULLABLE` | Customer full name |
| `customer_email` | `STRING` | `NULLABLE` | Customer email address |
| `product_category` | `STRING` | `NULLABLE` | Product category classification |
| `amount` | `FLOAT` | `NULLABLE` | Total sales order transaction amount |
| `currency` | `STRING` | `NULLABLE` | Currency code (e.g. USD) |
| `order_status` | `STRING` | `NULLABLE` | Order status (e.g. COMPLETED, PENDING) |
| `created_at` | `TIMESTAMP` | `NULLABLE` | Timestamp when order was originally created |
| `order_date` | `DATE` | `REQUIRED` | Date of sales order (Partition Key) |
| `ingestion_timestamp` | `TIMESTAMP` | `REQUIRED` | UTC Timestamp when record was loaded by ETL |
| `etl_batch_id` | `STRING` | `REQUIRED` | UUID identifying Cloud Run Job execution batch |

---

## 3. Directory Layout

```
├── Dockerfile                   # Python 3.11 Cloud Run Job container
├── requirements.txt             # Pipeline dependencies
├── env.deploy.json              # Deployment configuration variables
├── transformation_spec.json     # Declarative transformation mapping
├── app.py                       # Application entrypoint wrapper
├── pipeline/
│   ├── __init__.py
│   ├── extractor.py             # GCS CSV Extractor
│   ├── transformer.py           # Sanitization & deduplication engine
│   ├── loader.py                # BigQuery partition loader
│   └── run_sales_etl.py         # Standalone CLI / Job runner
├── schemas/
│   ├── aarchi_gcs_test1_schema.json
│   └── sales_schema.json
├── sql/
│   └── ddl/
│       └── aarchi_gcs_test1.sql # BigQuery DDL with partitioning & clustering
└── tests/
    ├── __init__.py
    ├── test_sales_etl.py        # Transformation and unit tests
    └── test_sales_etl_pipeline.py
```

---

## 4. Local Execution & Testing

### Running Tests
```bash
pip install -r requirements.txt
pytest -v
```

### Running the Standalone ETL Script
```bash
export GCS_SOURCE_BUCKET="sdlc-workspec-store"
export GCS_SOURCE_PREFIX="etl/data/raw_sales_data.csv"
export GCP_PROJECT_ID="upbeat-repeater-477110-q6"
export BIGQUERY_DATASET="analytics"
export BIGQUERY_TABLE="aarchi_gcs_test1"

python -m pipeline.run_sales_etl
```
