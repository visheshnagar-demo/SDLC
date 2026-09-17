# GCS to BigQuery Analytics ETL Data Pipeline

**Jira Issue**: SCRUM-310  
**GCP Target Project**: `upbeat-repeater-477110-q6`  
**Target BigQuery Dataset**: `analytics`  
**Source Location**: `gs://sdlc-workspec-store/etl/data/my_file (1).csv`  
**Target Tables**: `transformed_data`, `analytics_errors`  

---

## 1. Overview

This production ETL pipeline automates the extraction, cleansing, transformation, and loading of raw CSV datasets from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`) into Google BigQuery (`upbeat-repeater-477110-q6:analytics.transformed_data`).

### Key Features
- **GCS Extractor**: Robust streaming extraction supporting URL-encoded paths and GCS authentication.
- **Data Transformer**: Header sanitization, null normalization, timestamp standardization (ISO 8601 UTC), and dead-letter error record capture.
- **BigQuery Loader**: High-throughput atomic BigQuery loads with automated dataset and table provisioning.
- **Auto-Boot Serverless Container**: Cloud Run compatible container listening on port `8080` with auto-boot ETL trigger on startup.

---

## 2. Directory Structure

```
├── server/
│   ├── main.py                     # CLI & FastAPI HTTP entrypoint
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── extractor.py            # GCS CSV extraction logic
│   │   ├── transformer.py          # Data cleansing, schema validation & transformation
│   │   ├── loader.py               # BigQuery batch ingestion & error logging
│   │   └── pipeline.py             # End-to-end ETL orchestrator
│   ├── schemas/
│   │   ├── transformed_data_schema.json
│   │   └── analytics_errors_schema.json
│   ├── sql/
│   │   └── ddl/
│   │       └── create_analytics_tables.sql
│   ├── tests/
│   │   ├── test_extractor.py
│   │   ├── test_transformer.py
│   │   ├── test_loader.py
│   │   └── test_pipeline.py
│   └── requirements.txt
├── dags/
│   └── gcs_to_bigquery_analytics_dag.py
├── pipeline/
│   └── run_gcs_to_bigquery_analytics.py
├── app.py                          # Auto-boot Cloud Run service
├── Dockerfile                      # Production container image definition
├── requirements.txt
└── README.md
```

---

## 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
GCP_PROJECT_ID=upbeat-repeater-477110-q6
GCS_BUCKET_NAME=sdlc-workspec-store
GCS_SOURCE_BLOB=etl/data/my_file (1).csv
BQ_DATASET_ID=analytics
BQ_TABLE_ID=transformed_data
BQ_ERROR_TABLE_ID=analytics_errors
WRITE_DISPOSITION=WRITE_APPEND
PORT=8080
```

---

## 4. Local Execution & Testing

### Running Tests
```bash
pytest server/tests/ tests/ -v
```

### Running CLI Pipeline
```bash
python -m server.main
```

### Running HTTP Service
```bash
python app.py
# or
uvicorn server.main:app --host 0.0.0.0 --port 8080
```

### Docker Container Run
```bash
docker build -t gcs-bq-etl .
docker run -p 8080:8080 -e GCP_PROJECT_ID=upbeat-repeater-477110-q6 gcs-bq-etl
```
