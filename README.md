# Cloud SQL PostgreSQL to BigQuery ETL Data Pipeline (SCRUM-386)

## 1. Overview
This pipeline extracts test data from Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, database `postgres`, table `test_data`), cleans and sanitizes the records, and loads them into Google BigQuery (`analytics.postgres_test4`).

## 2. Architecture
- **Source**: Cloud SQL PostgreSQL with IAM Database Authentication (`559906504681-compute@developer`, Private IP).
- **Processing**: Modular Python 3.11 batch ETL pipeline (`server/etl/`).
- **Target**: Google BigQuery dataset `analytics`, table `postgres_test4`.
- **Runtime**: Ephemeral Google Cloud Run Job.

## 3. Directory Structure
```
├── Dockerfile
├── README.md
├── env.deploy.json
├── requirements.txt
├── transformation_spec.json
├── dags/
│   └── postgres_to_bigquery_scrum_386_dag.py
├── schemas/
│   └── postgres_test4_schema.json
├── sql/
│   └── ddl/
│       └── postgres_test4.sql
├── server/
│   ├── __init__.py
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── extractor.py
│   │   ├── transformer.py
│   │   ├── loader.py
│   │   ├── main.py
│   │   └── requirements.txt
│   └── tests/
│       ├── __init__.py
│       └── test_etl.py
└── tests/
    └── test_postgres_to_bigquery_scrum_386_pipeline.py
```

## 4. Local Execution
```bash
# Install dependencies
pip install -r requirements.txt

# Run test suite
pytest

# Execute ETL batch job
python -m server.etl.main
```
