# Cloud SQL PostgreSQL to BigQuery ETL Pipeline

**Issue Key:** SCRUM-347  
**GCP Project:** `upbeat-repeater-477110-q6`  
**Pipeline ID:** `cloudsql_postgres_to_bigquery_etl`  

---

## 1. Overview
This production-grade ETL pipeline extracts data from Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, DB: `postgres`, Table: `test_data`), cleans the data (whitespace trimming, null sanitization, type coercion), and loads the transformed records idempotently into Google BigQuery (`analytics.postgres_test1`).

## 2. Architecture & Tech Stack
- **Runtime:** Python 3.11
- **Extraction:** Cloud SQL Python Connector / SQLAlchemy / pg8000
- **Transformation:** Pandas / PyArrow (vectorized cleaning and type coercion)
- **Loading:** Google Cloud BigQuery API (`LoadJobConfig` with `WRITE_TRUNCATE` / `WRITE_APPEND`)
- **Containerization:** Docker (Cloud Run Job)
- **Testing:** Pytest / Pytest-Mock

## 3. Data Schema & Transformations

### Source & Target Mapping
| Source Column (`test_data`) | Target Column (`postgres_test1`) | Target Type | Transformation Applied |
|---|---|---|---|
| `id` | `id` | `STRING` | Strip whitespace, string type coercion |
| `raw_text` | `raw_text` | `STRING` | Strip whitespace, sanitize null strings (`"null"`, `"None"`, `""` -> `NULL`) |
| `numeric_val` | `numeric_val` | `FLOAT64` | Parse float, coerce invalid to `NULL` |
| `is_active` | `is_active` | `BOOLEAN` | Parse truthy/falsy values (`true`/`1`/`yes` -> `True`, `false`/`0`/`no` -> `False`) |
| `created_at` | `created_at` | `TIMESTAMP` | Coerce to ISO 8601 Timestamp |

## 4. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GCP_PROJECT_ID` | Target GCP Project | `upbeat-repeater-477110-q6` |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL Connection Name | `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db` |
| `POSTGRES_DB` | Source Database Name | `postgres` |
| `POSTGRES_USER` | Source User / IAM Account | `559906504681-compute@developer` |
| `POSTGRES_PASSWORD` | Source DB Password (optional for IAM) | `""` |
| `POSTGRES_PORT` | Source DB Port | `5432` |
| `SOURCE_TABLE` | Source Table Name | `test_data` |
| `BIGQUERY_DATASET` | Destination BigQuery Dataset | `analytics` |
| `BIGQUERY_TABLE` | Destination BigQuery Table | `postgres_test1` |
| `WRITE_DISPOSITION` | Load write mode | `WRITE_TRUNCATE` |

## 5. Local Execution & Testing

### Running Tests
```bash
pytest tests/ server/tests/ -v
```

### Running the ETL Pipeline Locally
```bash
python -m server.main
# Or run standalone pipeline runner:
python -m pipeline.run_cloudsql_postgres_to_bigquery_etl
```

### Docker Build & Run (Cloud Run Job)
```bash
docker build -t gcr.io/upbeat-repeater-477110-q6/cloudsql-postgres-to-bigquery-etl:latest .
docker run --env-file .env gcr.io/upbeat-repeater-477110-q6/cloudsql-postgres-to-bigquery-etl:latest
```
