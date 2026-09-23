# Sales Order ETL Pipeline (Cloud Run Job)

Serverless batch ETL pipeline containerized as a Google Cloud Run Job that ingests raw sales order CSV files from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and deduplicates the records, and loads them into a partitioned BigQuery table (`analytics.vishesh-test1`).

## Pipeline Architecture

- **Extraction**: Reads raw sales CSV files from GCS bucket with fail-fast validation.
- **Validation & Circuit Breaker**: Dynamic schema-on-read inspection and circuit breaker tripping if quarantine rate > 20%.
- **Transformation & Deduplication**: Whitespace trimming, email normalization, float/timestamp coercion, and deduplication by `order_id` (retaining the latest `created_at`).
- **Loading**: Partitioned (`DAY` on `created_at`) and clustered (`order_id`, `customer_id`) BigQuery batch load.
- **Observability**: Structured JSON telemetry emitted to standard output for Google Cloud Logging.

## Local Execution & Testing

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run automated test suite:
   ```bash
   pytest tests/
   ```
3. Run the standalone pipeline runner:
   ```bash
   python -m server.main
   ```

## Cloud Run Job Deployment

The container is built from the root `Dockerfile` and deployed as a batch Job:
```bash
docker build -t gcr.io/${GCP_PROJECT_ID}/sales-order-etl:latest .
```
