# GCS to BigQuery ETL Pipeline (SCRUM-375)

Automated ETL pipeline designed to extract tour earnings datasets from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), sanitize and coerce tabular attributes into strongly-typed structures, and idempotently load the dataset into Google BigQuery (`upbeat-repeater-477110-q6.analytics.test01`).

---

## 1. Architecture Overview

- **Extraction**: Streams raw CSV files from GCS or local storage via `GCSExtractor`.
- **Transformation**: Normalizes column names, removes footnote markers (e.g., `[4]`, `[7]`), strips currency symbols and commas, coerces nulls, and appends audit metadata (`_etl_loaded_at`, `_source_file`).
- **Circuit Breaker**: Isolates malformed rows into quarantine and halts execution if error rate breaches the 5% threshold.
- **BigQuery Loading**: Uses BigQuery Load Job API with atomic `WRITE_TRUNCATE` or `WRITE_APPEND` semantics and daily time-partitioning on `_etl_loaded_at`.
- **Execution Runtimes**: Deployable as a Cloud Run Job (zero-idle container), Python CLI, or Apache Airflow DAG.

---

## 2. Target BigQuery Schema (`analytics.test01`)

| Column Name | Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `rank` | `INTEGER` | `NULLABLE` | Ranking of the tour |
| `peak` | `INTEGER` | `NULLABLE` | Peak position achieved |
| `all_time_peak` | `INTEGER` | `NULLABLE` | All-time peak position |
| `actual_gross` | `INTEGER` | `NULLABLE` | Actual gross earnings |
| `adjusted_gross_in_2022_dollars` | `INTEGER` | `NULLABLE` | Adjusted gross in 2022 dollars |
| `artist` | `STRING` | `NULLABLE` | Artist name |
| `tour_title` | `STRING` | `NULLABLE` | Tour title |
| `years` | `STRING` | `NULLABLE` | Years active / performed |
| `shows` | `INTEGER` | `NULLABLE` | Number of shows |
| `average_gross` | `INTEGER` | `NULLABLE` | Average gross per show |
| `ref` | `STRING` | `NULLABLE` | Reference citations |
| `_etl_loaded_at` | `TIMESTAMP` | `REQUIRED` | Load timestamp (partitioning column) |
| `_source_file` | `STRING` | `REQUIRED` | Source GCS file URI |

---

## 3. Local Development & Execution

### Prerequisites
- Python 3.11+
- Google Cloud SDK (`gcloud auth application-default login`)

### Setup
```bash
pip install -r requirements.txt
```

### Running the Pipeline
```bash
python -m server.main --source "gs://sdlc-workspec-store/etl/data/my_file (1).csv" \
                      --project "upbeat-repeater-477110-q6" \
                      --dataset "analytics" \
                      --table "test01" \
                      --write-disposition "WRITE_TRUNCATE"
```

Or using standalone Cloud Run entrypoint:
```bash
python -m pipeline.run_test01_pipeline
```

### Running Tests
```bash
pytest
```

---

## 4. Container Deployment (Cloud Run Job)

```bash
docker build -t gcr.io/upbeat-repeater-477110-q6/etl-test01:latest .
docker run --rm \
  -e SOURCE_GCS_URI="gs://sdlc-workspec-store/etl/data/my_file (1).csv" \
  -e GCP_PROJECT="upbeat-repeater-477110-q6" \
  -e BIGQUERY_DATASET="analytics" \
  -e BIGQUERY_TABLE="test01" \
  gcr.io/upbeat-repeater-477110-q6/etl-test01:latest
```
