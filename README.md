# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-366)

## Overview
Automated, batch ETL pipeline that extracts raw data from Google Cloud SQL PostgreSQL (`test_data`), performs data sanitization and type coercion, and idempotently loads the cleaned dataset into Google BigQuery (`analytics.postgres_test2`).

## Architecture
- **Source**: Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, DB: `postgres`, Table: `test_data`)
- **Connector**: Cloud SQL Python Connector with IAM database authentication (`559906504681-compute@developer`) over Private IP
- **Transformation**: Vectorized data cleaning (whitespace trimming, null normalization, UTC timestamp coercion, numeric parsing, deduplication) using Python / Pandas / PyArrow
- **Sink**: Google BigQuery (`analytics.postgres_test2`) with `WRITE_TRUNCATE` idempotent batch ingestion
- **Execution Target**: Cloud Run Job (headless, batch execution) / Cloud Composer Airflow DAG

## Environment Configuration (`env.deploy.json`)
```json
{
  "INSTANCE_CONNECTION_NAME": "upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db",
  "POSTGRES_DB": "postgres",
  "POSTGRES_USER": "559906504681-compute@developer",
  "POSTGRES_PORT": "5432",
  "POSTGRES_TABLE": "test_data",
  "CLOUD_SQL_IP_TYPE": "PRIVATE",
  "GCP_PROJECT_ID": "upbeat-repeater-477110-q6",
  "BIGQUERY_DATASET": "analytics",
  "BIGQUERY_TABLE": "postgres_test2"
}
```

## Running the Pipeline Locally / in Container
```bash
# Install dependencies
pip install -r requirements.txt

# Execute ETL Pipeline Job
python -m pipeline.run_postgres_to_bigquery
```

## Running Tests
```bash
pytest tests/ -v
```
