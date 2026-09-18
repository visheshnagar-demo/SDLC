# GCS to BigQuery ETL Pipeline (SCRUM-321)

Production-grade ETL pipeline ingesting CSV data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`) and loading transformed records into Google BigQuery table `upbeat-repeater-477110-q6.analytics.viswa`.

## Architecture Overview
- **Source**: Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`)
- **Transformation Engine**: Python 3.11 / Pandas / Standard ETL sanitization & enrichment
  - Header name normalization & sanitization
  - Type casting and null representation normalization
  - Synthetic UUID v4 Primary Key injection (`record_id`)
  - Deterministic SHA256 record hashing (`data_hash`)
  - Timestamp auditing (`ingested_at`, `source_file`)
- **Target Sink**: Google BigQuery (`upbeat-repeater-477110-q6.analytics.viswa`)
  - Partitioned by `DATE(ingested_at)`
  - Clustered by `record_id`
- **Orchestration / Execution Modes**:
  1. **Serverless Auto-Boot Container (`app.py` & `Dockerfile`)**: Boots on Cloud Run (port 8080) and immediately executes the ETL pipeline asynchronously, providing health & execution observability via HTTP endpoints.
  2. **Standalone Runner (`pipeline/run_gcs_to_bigquery_viswa.py`)**: Can be invoked directly via CLI.
  3. **Airflow DAG (`dags/gcs_to_bigquery_viswa_dag.py`)**: Decoupled staging workflow with GCP operators.

## Directory Structure
```
├── app.py                                    # Cloud Run Auto-Boot entrypoint & healthcheck HTTP server
├── Dockerfile                                # Container image definition (Python 3.11)
├── requirements.txt                          # Dependencies
├── README.md                                 # Pipeline documentation
├── dags/
│   └── gcs_to_bigquery_viswa_dag.py         # Airflow DAG (Composer compatible)
├── pipeline/
│   ├── run_gcs_to_bigquery_viswa.py          # Standalone ETL pipeline runner
│   └── gcs_to_bigquery_viswa_README.md
├── schemas/
│   └── viswa_schema.json                     # BigQuery table JSON schema
├── sql/
│   └── ddl/
│       └── viswa.sql                         # BigQuery DDL with partition & cluster keys
└── tests/
    └── test_gcs_to_bigquery_viswa_pipeline.py# Automated pytest test suite
```

## Running Locally

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Execute Standalone ETL Runner
```bash
python -m pipeline.run_gcs_to_bigquery_viswa
```

### 3. Run Validation Tests
```bash
pytest tests/ -v
```

### 4. Run Auto-Boot HTTP Server
```bash
python app.py
```
- GET `/healthz` or `/status`: Returns pipeline run execution status and record metrics.
- POST `/run`: Triggers a new pipeline run.
