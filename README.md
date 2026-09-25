# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-395)

Production-grade serverless batch ETL pipeline extracting raw records from Google Cloud SQL PostgreSQL (`kttest_data`), applying in-memory cleaning, deduplication, and null sanitization, and ingesting clean records into Google BigQuery (`analytics.postgres_test2`).

## Architecture & Features

- **Decoupled Batch ETL Architecture**: Containerized batch execution targeted for Cloud Run Job or standalone runner.
- **Passwordless Cloud SQL IAM Auth**: Direct connection using `cloud-sql-python-connector` with IAM database authentication.
- **In-flight Dynamic Schema Discovery & Data Sanitization**:
  - Vectorized whitespace stripping on text fields.
  - Standardized null normalization (`""`, `"null"`, `"NULL"`, `"nan"` -> `None`).
  - Strict deduplication preserving first record occurrence.
  - Timestamp parsing to UTC ISO-8601.
  - Fail-fast circuit breaker preventing 100% data loss anomalies.
- **Optimized BigQuery Loading**: Idempotent dataset verification and high-performance loading with PyArrow type coercion and schema reconciliation.

## Repository Structure

```
├── Dockerfile                     # Python 3.11 batch container definition
├── requirements.txt               # Pinned dependencies
├── transformation_spec.json       # Source-to-target column mappings & transformations
├── env.deploy.json                # Deployment environment configuration
├── env.deploy.yaml                # Harness/Cloud Run env specification
├── schemas/
│   └── postgres_test2_schema.json # BigQuery destination schema
├── sql/
│   └── ddl/
│       └── postgres_test2.sql     # Target table DDL
├── src/
│   ├── __init__.py
│   ├── config.py                  # Configuration loader
│   ├── extractor.py               # Cloud SQL IAM connector & extractor
│   ├── transformer.py             # Data cleaning & sanitization engine
│   ├── loader.py                  # BigQuery schema reconciler & loader
│   ├── logger.py                  # Google Cloud JSON structured logger
│   └── orchestrator.py            # End-to-end pipeline runner
├── dags/
│   └── postgres_to_bigquery_kttest_dag.py # Airflow DAG specification
├── pipeline/
│   └── run_postgres_to_bigquery_kttest.py # Standalone runner
└── tests/
    ├── test_config.py
    ├── test_extractor.py
    ├── test_transformer.py
    ├── test_loader.py
    ├── test_orchestrator.py
    └── test_postgres_to_bigquery_kttest_pipeline.py
```

## Environment Variables

| Variable | Description | Target Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL instance | `upbeat-repeater-477110-q6:us-central1:sdlc-etldemo-db` |
| `POSTGRES_DB` | Source database | `postgres` |
| `POSTGRES_USER` | IAM Service Account User | `559906504681-compute@developer` |
| `SOURCE_TABLE` | Source PostgreSQL table | `kttest_data` |
| `BIGQUERY_DATASET` | Target BigQuery dataset | `analytics` |
| `BIGQUERY_TABLE` | Target BigQuery table | `postgres_test2` |
| `CLOUD_SQL_IP_TYPE` | Cloud SQL IP mode | `PRIVATE` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Local Execution & Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run test suite
pytest tests/ -v

# Run pipeline locally
python -m src.orchestrator
```
