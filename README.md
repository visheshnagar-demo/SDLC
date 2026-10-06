# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-414)

Enterprise-grade serverless batch ETL pipeline extracting transactional data from Google Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, database `postgres`, source table `test_data`), applying data cleaning and transformation logic, and loading into Google BigQuery (`analytics.postgres_test5`).

## Architecture Overview
- **Compute**: Google Cloud Run Job (Python 3.11 container, batch execution, zero idle cost)
- **Source**: Google Cloud SQL PostgreSQL authenticated via IAM database credentials (`559906504681-compute@developer`, `IPTypes.PRIVATE`)
- **Target**: Google BigQuery (`analytics.postgres_test5`) partitioned by `created_at`
- **Orchestration**: Self-contained Cloud Run Job runner with companion Cloud Composer / Airflow DAG

## Project Structure
```
├── Dockerfile                                      # Container build definition for Cloud Run Job
├── env.deploy.json                                 # Deployment environment variables with IAM auth
├── env.deploy.yaml                                 # Deployment YAML configuration
├── transformation_spec.json                        # Schema transformation contract
├── requirements.txt                                # Python dependencies (cloud-sql-python-connector, pyarrow, bigquery)
├── dags/
│   └── postgres_to_bigquery_etl_dag.py             # Airflow DAG for Cloud Composer
├── pipeline/
│   └── run_postgres_to_bigquery_etl.py             # Standalone production ETL runner script
├── schemas/
│   └── postgres_test5_schema.json                  # BigQuery target table schema definition
├── sql/
│   └── ddl/
│       └── postgres_test5.sql                      # BigQuery target table DDL
└── tests/
    └── test_postgres_to_bigquery_etl_pipeline.py   # Pytest suite
```

## Running Locally

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export INSTANCE_CONNECTION_NAME="upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db"
export POSTGRES_DB="postgres"
export POSTGRES_USER="559906504681-compute@developer"
export CLOUD_SQL_IP_TYPE="PRIVATE"
export GCP_PROJECT_ID="upbeat-repeater-477110-q6"
export BIGQUERY_DATASET="analytics"
export BIGQUERY_TABLE="postgres_test5"
```

3. Run pipeline:
```bash
python -m pipeline.run_postgres_to_bigquery_etl
```

4. Run tests:
```bash
pytest
```
