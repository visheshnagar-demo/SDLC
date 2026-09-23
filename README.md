# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-365)

Automated, production-grade ETL batch pipeline extracting records from Google Cloud SQL PostgreSQL, sanitizing/normalizing data, and atomically loading into Google BigQuery.

---

## 1. Pipeline Architecture

- **Source**: Google Cloud SQL PostgreSQL
  - Instance: `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`
  - Database: `postgres`
  - Table: `test_data`
  - Authentication: IAM Database Authentication (`559906504681-compute@developer`)
- **Target**: Google BigQuery
  - Project: `upbeat-repeater-477110-q6`
  - Dataset: `analytics`
  - Table: `postgres_test2`
  - Partitioning: Day-partitioned on `ingested_at`
  - Clustering: Clustered by `id`
- **Transformation Engine**:
  - Vectorized whitespace stripping & normalization
  - Standardized null casting (`"null"`, `"None"`, `""`, `"N/A"` &rarr; `NULL`)
  - Deterministic deduplication on primary key `id` (preserving latest state)
  - UTC ISO-8601 timestamp coercion
  - Strict circuit breaker with anomaly isolation

---

## 2. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GCP_PROJECT` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `GCP_REGION` | GCP Region | `us-central1` |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL instance connection name | `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db` |
| `POSTGRES_DB` | Source PostgreSQL database | `postgres` |
| `POSTGRES_USER` | IAM PostgreSQL Service Account user | `559906504681-compute@developer` |
| `CLOUD_SQL_IP_TYPE` | Cloud SQL network IP type | `PRIVATE` |
| `SOURCE_TABLE` | Source table name | `test_data` |
| `BIGQUERY_DATASET` | Target BigQuery dataset | `analytics` |
| `BIGQUERY_TABLE` | Target BigQuery table | `postgres_test2` |
| `WRITE_DISPOSITION` | BigQuery write mode (`WRITE_TRUNCATE` / `WRITE_APPEND`) | `WRITE_TRUNCATE` |

---

## 3. Local Execution & Testing

### Run Tests:
```bash
pytest tests/ -v
```

### Run Batch Job:
```bash
python server/main.py
```
