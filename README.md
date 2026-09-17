# GCS to BigQuery ETL Pipeline (SCRUM-307)

## Overview
Automated, production-grade ETL data pipeline ingesting raw CSV datasets from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), validating and cleansing records, and loading structured outputs into Google BigQuery within the `analytics` dataset (`upbeat-repeater-477110-q6.analytics.gcs_transformed_data`).

## Architecture
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`)
- **Target Sink**: Google BigQuery (`upbeat-repeater-477110-q6:analytics.gcs_transformed_data`)
- **Dead-Letter Quarantine**: Google BigQuery (`upbeat-repeater-477110-q6:analytics.etl_deadletter_records`)
- **Orchestration / Execution Modes**:
  - **Serverless Auto-Boot Container**: Cloud Run container listening on port 8080 with auto-boot trigger on startup.
  - **FastAPI Management Service**: Interactive API for triggering runs and checking health (`POST /api/v1/etl/jobs/run`, `GET /api/v1/etl/health`).
  - **Standalone Batch Runner**: `python pipeline/run_gcs_csv_to_bigquery_etl.py`
  - **Airflow DAG**: `dags/gcs_csv_to_bigquery_etl_dag.py`

## Repository Structure
```
├── dags/
│   └── gcs_csv_to_bigquery_etl_dag.py
├── pipeline/
│   └── run_gcs_csv_to_bigquery_etl.py
├── schemas/
│   └── gcs_transformed_data_schema.json
├── sql/
│   └── ddl/
│       ├── gcs_transformed_data.sql
│       └── etl_deadletter_records.sql
├── server/
│   ├── __init__.py
│   ├── main.py
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── extractor.py
│   │   ├── transformer.py
│   │   ├── loader.py
│   │   └── deadletter.py
│   ├── schemas/
│   │   └── data_schema.json
│   ├── sql/
│   │   └── ddl/
│   │       ├── gcs_transformed_data.sql
│   │       └── etl_deadletter_records.sql
│   └── tests/
│       ├── __init__.py
│       └── test_etl_pipeline.py
├── tests/
│   └── test_gcs_csv_to_bigquery_etl_pipeline.py
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

## Running Locally

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Standalone Pipeline
```bash
python pipeline/run_gcs_csv_to_bigquery_etl.py
```

### 3. Run FastAPI Service
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8080
```

### 4. Run Test Suite
```bash
pytest
```
