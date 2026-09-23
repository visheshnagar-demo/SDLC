# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-354)

An enterprise-grade, batch ETL pipeline that extracts relational records from Google Cloud SQL PostgreSQL, cleans and normalizes the data in-memory, and loads it into Google BigQuery using Cloud Run Job serverless architecture.

## Architecture Overview

```
[Cloud SQL PostgreSQL: test_data]
               │ (IAM Database Auth via Cloud SQL Connector)
               ▼
   [PostgresExtractor: SQLAlchemy]
               │
               ▼
      [DataCleaner: Pandas]
   ├── String whitespace trimming
   ├── Pseudo-null standardization
   ├── UTC timestamp normalization
   ├── Deduplication on primary keys
   └── Injection of _etl_loaded_at metadata
               │
               ▼
   [BigQueryLoader: BQ SDK]
               │ (LoadJobConfig with WRITE_TRUNCATE/APPEND)
               ▼
[BigQuery: upbeat-repeater-477110-q6.analytics.postgres_test1]
```

## Security & IAM Authentication

This pipeline utilizes Google Cloud IAM database authentication (`cloud-sql-python-connector` with `enable_iam_auth=True`).
- **Service Account / IAM User**: `559906504681-compute@developer`
- **Zero Static Secrets**: No database passwords stored in plaintext or environment variables.
- **VPC / IP Configuration**: Connects over private IP (`CLOUD_SQL_IP_TYPE=PRIVATE`).

## Project Layout

```
├── .env.example
├── Dockerfile
├── README.md
├── env.deploy.json
├── requirements.txt
├── schemas/
│   └── postgres_test1_schema.json
├── server/
│   ├── __init__.py
│   ├── requirements.txt
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── cleaner.py
│   │   ├── extractor.py
│   │   ├── loader.py
│   │   ├── main.py
│   │   └── pipeline.py
│   └── tests/
│       ├── __init__.py
│       └── test_etl_pipeline.py
├── sql/
│   └── ddl/
│       └── postgres_test1.sql
├── tests/
│   ├── __init__.py
│   └── test_etl_pipeline.py
└── transformation_spec.json
```

## Local Execution & Testing

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
pytest tests/ -v
```

### 3. Run Pipeline Locally (with configured GCP credentials)
```bash
python -m server.etl.main --source-table test_data --target-dataset analytics --target-table postgres_test1
```

## Container Deployment (Cloud Run Job)

Build and deploy container image:
```bash
docker build -t gcr.io/upbeat-repeater-477110-q6/postgres-to-bq-etl:latest .
```
Execute as Cloud Run Job:
```bash
gcloud run jobs create postgres-to-bq-job \
  --image gcr.io/upbeat-repeater-477110-q6/postgres-to-bq-etl:latest \
  --region us-central1 \
  --env-vars-file env.deploy.json
```
