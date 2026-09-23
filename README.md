# Sales Order ETL Pipeline (Cloud Run Job)

Production-grade batch ETL data pipeline for Jira Issue **SCRUM-358**.
Ingests sales order records from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleans and deduplicates them, and loads them into partitioned Google BigQuery table `analytics.vishesh-test1`.

---

## 1. Architecture Overview

- **Compute:** Google Cloud Run Job (Serverless, zero-idle batch execution).
- **Source:** Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`).
- **Destination:** Google BigQuery (`upbeat-repeater-477110-q6.analytics.vishesh-test1`).
- **Partitioning:** Day-partitioned on `DATE(created_at)`.
- **Clustering:** Clustered by `order_status, product_category`.
- **Python Version:** 3.11.

---

## 2. Pipeline Stages

1. **Extraction (`pipeline/extractor.py`):**
   - Connects to GCS bucket using Google Cloud Storage client.
   - Downloads raw CSV bytes with fail-fast validation if source is missing.
2. **Validation (`pipeline/validator.py`):**
   - Discovers schema and asserts required column presence.
   - Quarantines invalid records and triggers circuit breaker if 100% of rows fail.
3. **Transformation (`pipeline/transformer.py`):**
   - Trims whitespaces from strings.
   - Standardizes null markers (`"nan"`, `"null"`, `""` -> `None`).
   - Normalizes numeric attributes and ISO 8601 UTC timestamps.
   - Adds audit timestamp `ingested_at`.
4. **Deduplication (`pipeline/deduplicator.py`):**
   - Deduplicates records on business key `order_id`, keeping latest chronological record.
5. **BigQuery Loading (`pipeline/loader.py`):**
   - Ensures partitioned BigQuery dataset and table are initialized.
   - Loads transformed DataFrame atomically via PyArrow.
6. **Structured Audit Logging (`pipeline/logger.py`):**
   - Emits structured JSON execution metrics to Google Cloud Logging.

---

## 3. Local Execution & Testing

### Prerequisites
- Python 3.11+
- Virtual environment with dependencies installed:
  ```bash
  pip install -r requirements.txt
  ```

### Running Tests
```bash
pytest tests/ -v
```

### Running Pipeline Locally
```bash
export GCP_PROJECT_ID=upbeat-repeater-477110-q6
export GCS_SOURCE_BUCKET=sdlc-workspec-store
export GCS_SOURCE_PREFIX=etl/data/raw_sales_data.csv
export BIGQUERY_DATASET=analytics
export BIGQUERY_TABLE=vishesh-test1
export WRITE_DISPOSITION=WRITE_TRUNCATE

python main.py
```

---

## 4. Cloud Run Job Deployment

The pipeline is packaged into a minimal Docker container:
```bash
docker build -t gcr.io/upbeat-repeater-477110-q6/etl-sales-pipeline:latest .
```

Execution in Cloud Run Jobs:
```bash
gcloud run jobs execute etl-sales-pipeline --region=us-central1
```
