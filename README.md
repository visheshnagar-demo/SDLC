# Automated ETL Pipeline: GCS to BigQuery (`test2`)

**Jira Issue**: SCRUM-330  
**GCP Project**: `upbeat-repeater-477110-q6`  
**Dataset**: `analytics`  
**Target Table**: `test2`  
**Source Path**: `gs://sdlc-workspec-store/etl/data/my_file (1).csv`  

---

## 1. Overview
This production-grade ETL batch pipeline extracts concert tour gross statistics from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), cleanses and normalizes headers/data types, validates quality through a circuit breaker gate, and loads the structured analytical records into BigQuery table `upbeat-repeater-477110-q6.analytics.test2`.

## 2. Pipeline Architecture
- **Extractor**: Streams CSV data directly from GCS bucket with chunked resilience.
- **Schema Engine**: Dynamically sanitizes raw headers to compliant snake_case identifiers.
- **Transformer**: Coerces numeric amounts, strips footnote citations (e.g., `[4]`), normalizes currency, and appends audit fields (`_ingested_at`, `_source_file`, `_pipeline_version`).
- **Circuit Breaker**: Evaluates corruption thresholds (< 5% corruption allowed) before triggering BigQuery load.
- **Loader**: Automatically manages dataset creation and uses atomic BigQuery `WRITE_TRUNCATE` loads.

## 3. Environment Configuration
The pipeline is configured via environment variables:

| Variable | Description | Default |
|---|---|---|
| `GCP_PROJECT_ID` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `BIGQUERY_DATASET` | Target BigQuery dataset | `analytics` |
| `BIGQUERY_TABLE` | Target BigQuery table | `test2` |
| `GCS_SOURCE_BUCKET`| Source GCS bucket name | `sdlc-workspec-store` |
| `GCS_SOURCE_PREFIX`| Object path in GCS | `etl/data/my_file (1).csv` |
| `MAX_ERROR_THRESHOLD_PCT` | Circuit breaker threshold | `0.05` |

## 4. Local Execution & Testing

### Running Tests
```bash
pytest
```

### Running the Pipeline Locally
```bash
python -m server.pipeline.main
# or using the Cloud Run Job runner
python -m pipeline.run_gcs_to_bigquery_test2
```

## 5. Deployment as Cloud Run Job
```bash
docker build -t gcr.io/upbeat-repeater-477110-q6/etl-scrum-330:latest .
gcloud run jobs create etl-scrum-330 --image gcr.io/upbeat-repeater-477110-q6/etl-scrum-330:latest
gcloud run jobs execute etl-scrum-330
```
