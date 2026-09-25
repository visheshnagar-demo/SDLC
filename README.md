# ETL Pipeline: `kttest04` (GCS to BigQuery)

Production-grade batch ETL pipeline ingesting concert tour CSV data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), performing type-safe cleansing and schema transformation, sorting records ascending by `rank`, and idempotently loading into BigQuery table `upbeat-repeater-477110-q6.analytics.kttest04`.

## Architecture & Data Flow

```text
Google Cloud Storage (CSV)
         │
         ▼
[GCSSourceExtractor] (Streaming extract, existence check, retry backoff)
         │
         ▼
[RankSortTransformer] (Header normalization, currency/annotation cleansing, Order by rank ASC)
         │
         ▼
[BigQueryTargetLoader] (Dataset check, schema reconciliation, WRITE_TRUNCATE batch load)
         │
         ▼
Google BigQuery Table (upbeat-repeater-477110-q6.analytics.kttest04)
```

## Target Schema (`kttest04`)

| Field Name | Type | Mode | Description |
| :--- | :--- | :--- | :--- |
| `rank` | `INTEGER` | `NULLABLE` | Tour ranking by gross revenue |
| `peak` | `INTEGER` | `NULLABLE` | Peak chart or box office position |
| `all_time_peak` | `INTEGER` | `NULLABLE` | All-time peak ranking position |
| `actual_gross` | `INTEGER` | `NULLABLE` | Actual gross revenue in USD |
| `adjusted_gross_2022_dollars` | `INTEGER` | `NULLABLE` | Adjusted gross revenue in 2022 USD |
| `artist` | `STRING` | `NULLABLE` | Touring artist or band name |
| `tour_title` | `STRING` | `NULLABLE` | Title of the concert tour |
| `years` | `STRING` | `NULLABLE` | Years the tour was active |
| `shows` | `INTEGER` | `NULLABLE` | Total number of shows performed |
| `average_gross` | `INTEGER` | `NULLABLE` | Average gross revenue per show in USD |
| `ref` | `STRING` | `NULLABLE` | Reference citations |
| `_ingested_at` | `TIMESTAMP` | `NULLABLE` | Timestamp when record was ingested into BigQuery |

## Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GCS_SOURCE_URI` | `gs://sdlc-workspec-store/etl/data/my_file (1).csv` | GCS source URI |
| `GCP_PROJECT_ID` | `upbeat-repeater-477110-q6` | Target GCP project |
| `BQ_DATASET_ID` | `analytics` | BigQuery dataset name |
| `BQ_TABLE_ID` | `kttest04` | BigQuery target table name |
| `WRITE_DISPOSITION` | `WRITE_TRUNCATE` | BigQuery write disposition |

## Local Execution & Testing

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
pytest tests/ -v
```

### 3. Run Pipeline Locally / CLI
```bash
python -m server.pipeline \
  --source-gcs-uri "gs://sdlc-workspec-store/etl/data/my_file (1).csv" \
  --project-id "upbeat-repeater-477110-q6" \
  --dataset-id "analytics" \
  --table-name "kttest04"
```
