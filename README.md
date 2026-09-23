# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-368)

Serverless batch ETL pipeline extracting operational data from Google Cloud SQL PostgreSQL, sanitizing/cleansing records, and loading into Google BigQuery (`analytics.postgres_test2`).

## Pipeline Architecture

- **Source**: Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, database `postgres`, table `test_data`)
- **Extraction**: IAM-authenticated connection via `cloud-sql-python-connector` (service account: `559906504681-compute@developer.gserviceaccount.com`)
- **Transformation Engine**: Python 3.11 / Pandas / PyArrow
  - Leading and trailing whitespace trimming
  - Payload column standardization (`data_payload` -> `cleaned_payload`)
  - Null representation normalization (`"N/A"`, `""`, `"None"` -> `None`)
  - UTC ISO timestamp formatting for `created_at` and `updated_at`
  - Record deduplication keeping latest `updated_at` per primary key `id`
  - Audit metadata injection (`etl_ingested_at`)
- **Target Sink**: Google BigQuery (`analytics.postgres_test2`)
  - Partitioning on `etl_ingested_at`
  - Clustering on `id`
  - Idempotent `WRITE_TRUNCATE` load disposition

## Directory Layout

```
.
├── Dockerfile                                 # Container runtime definition
├── env.deploy.json                            # Cloud Run deployment configuration
├── requirements.txt                           # Production and testing dependencies
├── dags/
│   └── postgres_to_bigquery_dag.py           # Optional Airflow orchestration DAG
├── pipeline/
│   ├── __init__.py
│   ├── extractor.py                           # Cloud SQL IAM connector & extraction
│   ├── transformer.py                         # Data cleaning and schema casting
│   ├── loader.py                              # BigQuery load jobs
│   └── run_postgres_to_bigquery.py           # Standalone batch job entrypoint
├── schemas/
│   └── postgres_test2_schema.json            # Target BigQuery JSON schema
├── sql/
│   └── ddl/
│       └── postgres_test2.sql                # Target BigQuery SQL DDL
└── tests/
    ├── test_postgres_to_bigquery.py          # Unit & integration tests
    └── test_postgres_to_bigquery_pipeline.py # AST & connector configuration tests
```

## Local Development & Execution

### Running Tests
```bash
pytest tests/ -v
```

### Running the ETL Pipeline Locally
Set required environment variables:
```bash
export INSTANCE_CONNECTION_NAME="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
export POSTGRES_DB="postgres"
export POSTGRES_USER="559906504681-compute@developer.gserviceaccount.com"
export POSTGRES_TABLE="test_data"
export CLOUD_SQL_IP_TYPE="PRIVATE"
export GCP_PROJECT_ID="upbeat-repeater-477110-q6"
export BIGQUERY_DATASET="analytics"
export BIGQUERY_TABLE="postgres_test2"

python -m pipeline.run_postgres_to_bigquery
```

## Cloud Run Job Deployment
The pipeline executes as a serverless Cloud Run Job without idle container overhead:
```bash
# Entrypoint executed directly by Cloud Run Job:
CMD ["python", "-m", "pipeline.run_postgres_to_bigquery"]
```
