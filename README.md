# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-382)

## Overview
Automated batch ETL pipeline extracting raw data from Cloud SQL PostgreSQL (`sdlc-etl-demo-db`), performing data cleaning, standardization, deduplication, and schema validation, and loading the sanitized dataset into Google BigQuery table `analytics.postgres_test2`.

## Architecture & Specifications
- **Source**: Cloud SQL PostgreSQL
  - **Instance**: `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`
  - **Database**: `postgres`
  - **Table**: `test_data`
  - **Authentication**: Cloud SQL Python Connector with Google Cloud IAM Authentication (`559906504681-compute@developer`)
  - **IP Type**: Private IP (`CLOUD_SQL_IP_TYPE=PRIVATE`)
- **Target**: Google BigQuery
  - **Project**: `upbeat-repeater-477110-q6`
  - **Dataset**: `analytics`
  - **Table**: `postgres_test2`
  - **Write Disposition**: `WRITE_APPEND`
  - **Partitioning**: Day partitioned by `_etl_loaded_at`
  - **Clustering**: `id`
- **Deployment**: Standalone Batch Container / Cloud Run Job (Zero-scheduler, Zero-idle)

## Data Transformations
1. **Column Normalization**: Stripping special characters, lowercasing.
2. **String Cleaning**: Trimming leading/trailing whitespace, standardizing empty strings to `NULL`.
3. **Datetime Standardization**: Normalizing date and timestamp columns to UTC ISO 8601.
4. **Deduplication**: Removing identical duplicate rows across business keys.
5. **Audit Metadata Injection**: Appending `_etl_loaded_at` (UTC ingestion timestamp) and `_etl_source_instance` (`sdlc-etl-demo-db`).
6. **Circuit Breaker**: Halts execution if 100% of rows fail validation or if rejection threshold is breached.

## Repository Layout
```
├── config.py
├── main.py
├── Dockerfile
├── requirements.txt
├── env.deploy.json
├── transformation_spec.json
├── pipeline/
│   ├── __init__.py
│   ├── db_connector.py
│   ├── extractor.py
│   ├── transformer.py
│   ├── loader.py
│   ├── observability.py
│   └── run_postgres_test_data_to_bigquery.py
├── schemas/
│   ├── __init__.py
│   └── postgres_test2_schema.json
├── sql/
│   └── ddl/
│       └── postgres_test2.sql
├── tests/
│   ├── __init__.py
│   ├── test_pipeline.py
│   └── test_postgres_test_data_to_bigquery_pipeline.py
└── README.md
```

## Local Execution & Testing
```bash
# Install dependencies
pip install -r requirements.txt

# Run unit tests
pytest tests/
```
