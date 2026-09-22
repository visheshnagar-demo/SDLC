# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-352)

Production-grade automated ETL pipeline extracting data from Cloud SQL PostgreSQL (`test_data`), performing data cleaning/sanitization, deduplication, type coercion, and atomic loading into Google Cloud BigQuery (`analytics.postgres_test1`).

## 1. Architecture Overview

```
┌─────────────────────────────────┐
│ Cloud SQL PostgreSQL            │
│ instance: sdlc-etl-demo-db      │
│ db: postgres | tbl: test_data   │
└────────────────┬────────────────┘
                 │ (IAM auth / TLS)
                 ▼
┌─────────────────────────────────┐
│ Python 3.11 ETL Engine          │
│ • Schema Discovery on Read      │
│ • Whitespace & Null Cleaner     │
│ • Deduplication & Type Coercion │
│ • Circuit Breaker & Quarantine  │
│ • Metadata Enrichment           │
└────────────────┬────────────────┘
                 │ (Batch Parquet load)
                 ▼
┌─────────────────────────────────┐
│ Google Cloud BigQuery           │
│ project: upbeat-repeater-477110 │
│ dataset: analytics              │
│ table: postgres_test1           │
└─────────────────────────────────┘
```

## 2. Pipeline Components

- **`server/config.py`**: Pydantic settings loading PostgreSQL and BigQuery environment variables with strict zero-SQLite enforcement.
- **`server/extractor.py`**: Dynamic schema discovery and TLS extraction using Google Cloud SQL Connector.
- **`server/transformer.py`**: Whitespace trimming, null sanitization (`NULL`, `""`, `None`, `N/A`), deduplication, timestamp formatting, and circuit breaker evaluation (< 5% corrupt row threshold).
- **`server/loader.py`**: Google BigQuery atomic batch loader with day partitioning on `created_at` and clustering on `id`.
- **`server/main.py`**: Container entrypoint CLI supporting custom arguments and structured logging.
- **`pipeline/run_postgres_to_bigquery_scrum_352.py`**: Standalone Cloud Run Job runner.
- **`dags/postgres_to_bigquery_scrum_352_dag.py`**: Orchestration DAG reference for Apache Airflow / Cloud Composer.

## 3. Configuration & Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL Connection Identifier | `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db` |
| `POSTGRES_DB` | PostgreSQL Database Name | `postgres` |
| `POSTGRES_USER` | PostgreSQL Service User | `559906504681-compute@developer` |
| `SOURCE_TABLE` | Source PostgreSQL Table | `test_data` |
| `GCP_PROJECT_ID` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `BIGQUERY_DATASET` | Destination BigQuery Dataset | `analytics` |
| `BIGQUERY_TABLE` | Destination BigQuery Table | `postgres_test1` |
| `CIRCUIT_BREAKER_THRESHOLD`| Max corrupt row ratio | `0.05` |
| `WRITE_DISPOSITION` | Write mode (`WRITE_TRUNCATE` / `WRITE_APPEND`) | `WRITE_TRUNCATE` |

## 4. Local Execution & Testing

### Installation
```bash
pip install -r requirements.txt
```

### Running Pipeline
```bash
python -m server.main --source-table test_data --target-table analytics.postgres_test1 --write-mode truncate
```

### Running Test Suite
```bash
pytest
```
