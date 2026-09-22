# PostgreSQL to BigQuery Data Pipeline (SCRUM-342)

## Overview
Automated ETL pipeline designed to clean, transform, and load dataset `test_data` from PostgreSQL (`sdlc-etl-demo-db`, database `postgres`) into Google BigQuery table `test4` (`upbeat-repeater-477110-q6.analytics.test4`).

## Pipeline Architecture
- **Source**: PostgreSQL Table `test_data` (Cloud SQL instance `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, IAM Auth, Private IP)
- **Destination**: BigQuery Table `upbeat-repeater-477110-q6.analytics.test4`
- **Orchestration / Execution Mode**: Standalone Cloud Run Job & Cloud Composer / Apache Airflow DAG
- **Staging / Parquet Storage**: Intermediate local / GCS Parquet storage

## Data Transformations
1. **Column Standardization**: Snake_case column normalization.
2. **String Trimming & Cleaning**: Trims leading/trailing whitespace, maps empty/nan strings to null.
3. **Case Normalization**:
   - `email`: lowercased.
   - `status`: converted to uppercase (`UNKNOWN` default if null).
   - `name`: title-cased.
4. **Data Type Coercion**:
   - `amount`: coerced to `FLOAT64`.
   - `created_at` & `updated_at`: parsed to UTC timestamps.
5. **Ingestion Metadata**:
   - Injects `ingested_at` timestamp for auditability.

## Project Structure
```
├── Dockerfile
├── requirements.txt
├── transformation_spec.json
├── env.deploy.json
├── dags/
│   └── postgres_to_bq_test4_dag.py
├── pipeline/
│   └── run_postgres_to_bq_test4.py
├── schemas/
│   └── test4_schema.json
├── sql/
│   └── ddl/
│       └── test4.sql
└── tests/
    └── test_postgres_to_bq_test4_pipeline.py
```

## Running the Pipeline Locally
```bash
pip install -r requirements.txt
python -m pipeline.run_postgres_to_bq_test4
```

## Running Unit & Regression Tests
```bash
pytest tests/
```
