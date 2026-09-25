# Sales Order ETL Pipeline (SCRUM-390)

A serverless, containerized Cloud Run Job ETL data pipeline that extracts sales order CSV records from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and deduplicates the records, and loads them into a partitioned BigQuery table (`analytics.harshada-test4`).

---

## 1. Architecture Overview

- **Compute**: Google Cloud Run Job (Batch container, Python 3.11, Zero-idle)
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`)
- **Target Data Warehouse**: Google BigQuery (`upbeat-repeater-477110-q6.analytics.harshada-test4`)
- **Partitioning**: DAY partition on `created_at` timestamp.
- **Clustering**: `customer_id`, `order_status`.
- **Security & IAM**: Workload Identity / Service Account tokens via ADC.

```
[GCS Raw CSV Stream]
       │
       ▼
[Cloud Run Job Ingestion (extract_sales_data_from_gcs)]
       │
       ▼
[Data Cleaning & Deduplication (transform_and_deduplicate)]
  - Schema normalization (snake_case)
  - Type-safe casting (Int64, Float, ISO 8601 UTC Timestamps)
  - Primary-key deduplication on order_id (keep last)
  - Ingested audit timestamp generation
       │
       ▼
[Partitioned BigQuery Bulk Load (load_to_bigquery)]
  - Automatic dataset verification
  - Schema reconciliation & PyArrow serialization
  - Day-partitioned table insertion
```

---

## 2. Directory Structure

```
├── dags/
│   └── gcs_sales_to_bigquery_dag.py        # Optional Airflow orchestration reference
├── pipeline/
│   └── run_gcs_sales_to_bigquery.py        # Standalone connector ETL runner
├── schemas/
│   ├── harshada-test4_schema.json          # Target BigQuery schema JSON
│   └── harshada_test4_schema.json
├── sql/
│   └── ddl/
│       ├── harshada-test4.sql              # Target DDL with PARTITION & CLUSTER
│       └── harshada_test4.sql
├── server/
│   ├── Dockerfile                          # Cloud Run Job Dockerfile
│   ├── requirements.txt                    # Server runtime dependencies
│   ├── main.py                             # Main CLI entrypoint
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── config.py                       # Environment & pipeline configuration
│   │   ├── ingest.py                       # GCS extraction module
│   │   ├── transform.py                    # Cleaning & deduplication engine
│   │   └── loader.py                       # BigQuery partitioned loader
│   └── tests/
│       ├── __init__.py
│       └── test_etl.py                     # Unit & integration test suite
├── transformation_spec.json                # Source-to-target field mapping spec
├── env.deploy.json                         # Deployment environment parameters
├── Dockerfile                              # Root container definition
├── requirements.txt                        # Top-level dependencies
└── README.md
```

---

## 3. Environment Configuration

| Variable | Description | Default |
|---|---|---|
| `GCS_BUCKET_NAME` / `GCS_SOURCE_BUCKET` | Source GCS Bucket | `sdlc-workspec-store` |
| `GCS_SOURCE_BLOB` / `GCS_SOURCE_PREFIX` | Source Blob Path | `etl/data/raw_sales_data.csv` |
| `GCP_PROJECT_ID` | Google Cloud Project ID | `upbeat-repeater-477110-q6` |
| `BQ_DATASET_ID` / `BIGQUERY_DATASET` | BigQuery Target Dataset | `analytics` |
| `BQ_TABLE_ID` / `BIGQUERY_TABLE` | BigQuery Target Table | `harshada-test4` |
| `WRITE_MODE` | Write disposition | `append` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

---

## 4. Local Execution & Testing

### Running Tests Locally
```bash
pytest tests/ server/tests/
```

### Running ETL Locally
```bash
python server/main.py
```
Or standalone:
```bash
python -m pipeline.run_gcs_sales_to_bigquery
```

---

## 5. Deployment as Cloud Run Job

1. **Build Container Image**:
   ```bash
   docker build -t gcr.io/upbeat-repeater-477110-q6/sales-etl-job:latest .
   docker push gcr.io/upbeat-repeater-477110-q6/sales-etl-job:latest
   ```

2. **Execute Job**:
   ```bash
   gcloud run jobs execute sales-etl-job --region=us-central1
   ```
