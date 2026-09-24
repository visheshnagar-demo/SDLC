# Cloud SQL PostgreSQL to BigQuery ETL Pipeline

Production-grade batch ETL pipeline that extracts raw records from Cloud SQL PostgreSQL, sanitizes and cleans the data, and loads it into Google BigQuery.

## Pipeline Architecture

- **Source**: Google Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`)
  - **Database**: `postgres`
  - **Source Table**: `test_data`
  - **Authentication**: IAM Service Account Authentication via `cloud-sql-python-connector` (with `enable_iam_auth=True` and `IPTypes.PRIVATE`)
- **Transformation Engine**: Schema validation, string trimming, null-equivalent normalization, numeric & timestamp parsing, deduplication, and fail-fast circuit breakers.
- **Target Sink**: Google BigQuery (`analytics.postgres_test2`)
  - **Partitioning**: Day-partitioned on `_extracted_at`
  - **Clustering**: Clustered on `id`
  - **Write Disposition**: `WRITE_TRUNCATE` (idempotent batch reload)

## Directory Structure

```
├── Dockerfile                                 # Container build definition for Cloud Run Job
├── README.md                                  # Documentation and runbook
├── env.deploy.json                            # Cloud Run Job environment variables
├── requirements.txt                           # Python dependencies
├── transformation_spec.json                   # Transformation and schema mapping contract
├── dags/
│   ├── __init__.py
│   └── postgres_to_bigquery_dag.py            # Optional reference Airflow DAG
├── pipeline/
│   ├── __init__.py
│   ├── config.py                              # Environment configuration and IAM parser
│   ├── extractor.py                           # Cloud SQL connector extractor
│   ├── transformer.py                         # Data cleaning and transformation engine
│   ├── loader.py                              # BigQuery table and ingestion manager
│   └── run_postgres_to_bigquery.py            # Cloud Run Job standalone entrypoint
├── schemas/
│   └── postgres_test2_schema.json             # BigQuery target schema definition
├── sql/
│   └── ddl/
│       └── postgres_test2.sql                 # Target DDL with partitioning & clustering
└── tests/
    ├── __init__.py
    └── test_postgres_to_bigquery.py           # Unit and integration test suite
```

## Running the ETL Pipeline

### Local Development / Container Execution

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set environment variables
export INSTANCE_CONNECTION_NAME="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
export POSTGRES_DB="postgres"
export POSTGRES_USER="559906504681-compute@developer"
export CLOUD_SQL_IP_TYPE="PRIVATE"
export SOURCE_TABLE="test_data"
export GCP_PROJECT="upbeat-repeater-477110-q6"
export BIGQUERY_DATASET="analytics"
export BIGQUERY_TABLE="postgres_test2"

# 3. Execute pipeline
python -m pipeline.run_postgres_to_bigquery
```

### Running Tests

```bash
pytest tests/ -v
```
