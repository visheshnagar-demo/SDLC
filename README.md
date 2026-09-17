# Sales Order ETL Data Pipeline

Automated serverless batch ETL pipeline containerized for **Google Cloud Run Jobs**. Ingests raw sales order CSV files from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and validates attributes, deduplicates records on primary key `order_id` (preserving the freshest state), and loads data into a partitioned BigQuery analytics table (`analytics.new_sales_orders`).

---

## 1. Architecture Overview

- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`)
- **Compute**: Google Cloud Run Job (Python 3.11, Zero-idle containerized execution)
- **Target**: BigQuery dataset `analytics`, table `new_sales_orders` (Partitioned by `order_date`, Clustered by `customer_id`, `order_status`)
- **Observability**: Structured JSON logging to `stdout` compatible with Google Cloud Logging.

```
[ GCS Raw CSV Extract ]
         │
         ▼
[ GCS Extractor (Schema Discovery & Ingestion) ]
         │
         ▼
[ Transformation & Deduplication Engine ]
   - Whitespace trimming
   - Null normalization ("N/A", "null" -> None)
   - Currency & numeric cleaning
   - Timestamp parsing & `order_date` derivation
   - Deduplication on `order_id` (keeps latest `created_at`)
         │
         ▼
[ BigQuery Batch Loader ]
   - Automated dataset & table verification
   - Partitioning on `order_date`
   - Clustering on `customer_id`, `order_status`
         │
         ▼
[ BigQuery Table: analytics.new_sales_orders ]
```

---

## 2. Configuration & Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GCS_SOURCE_URI` | `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv` | Full GCS URI to source raw CSV file |
| `GCP_PROJECT_ID` | `upbeat-repeater-477110-q6` | GCP Project ID housing BigQuery |
| `BQ_DATASET` | `analytics` | BigQuery destination dataset |
| `BQ_TABLE` | `new_sales_orders` | BigQuery destination table |
| `BQ_WRITE_DISPOSITION` | `WRITE_APPEND` | Write mode (`WRITE_APPEND` or `WRITE_TRUNCATE`) |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `DRY_RUN` | `false` | If `true`, extracts and transforms without loading to BigQuery |

---

## 3. Local Development & Testing

### Installation
```bash
pip install -r requirements.txt
```

### Running Tests
```bash
pytest tests/ -v
```

### Running Pipeline Locally
```bash
python -m server.main --source-uri gs://sdlc-workspec-store/etl/data/raw_sales_data.csv --dry-run
```

---

## 4. Cloud Run Job Deployment

The pipeline is packaged into a Docker container designed to run as a Google Cloud Run Job:

```bash
# Build image
docker build -t gcr.io/upbeat-repeater-477110-q6/sales-order-etl-job:latest .

# Execute Cloud Run Job
gcloud run jobs create sales-order-etl-job \
  --image gcr.io/upbeat-repeater-477110-q6/sales-order-etl-job:latest \
  --region us-central1 \
  --env-vars-file env.deploy.json

gcloud run jobs execute sales-order-etl-job --region us-central1
```
