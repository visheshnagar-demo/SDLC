# ETL Pipeline: GCS to BigQuery (`viswa`)

Automated, idempotent, and resilient ETL pipeline that extracts concert tour records from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), applies schema discovery, normalization, validation, and sanitization transformations, and loads structured data into Google BigQuery table `viswa` in dataset `analytics` (project: `upbeat-repeater-477110-q6`).

## Architecture & Features
- **Zero-Scheduler / Cloud Run Job Architecture**: Containerized standalone batch ETL runner that executes and exits cleanly.
- **Dynamic Schema Discovery & Normalization**: Strips invalid characters, sanitizes column headers to snake_case, converts types (rank, shows, amounts), and standardizes missing values.
- **Circuit Breaker**: Validates data integrity before loading; halts execution if corruption exceeds threshold.
- **Idempotent BigQuery Loading**: Uses partitioned batch load jobs with `WRITE_TRUNCATE` / `WRITE_APPEND` disposition.
- **Cloud Logging & Observability**: Structured JSON logging capturing start/end timestamps, duration, and processed row metrics.

## Schema Definition
Target Table: `upbeat-repeater-477110-q6.analytics.viswa`
Partitioning: `_etl_loaded_at` (DAY)
Clustering: `artist`

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `rank` | INTEGER | Rank of the concert tour |
| `peak` | STRING | Peak position |
| `all_time_peak` | STRING | All time peak position |
| `actual_gross` | STRING | Actual gross revenue |
| `adjusted_gross_in_2022_dollars` | STRING | Adjusted gross revenue in 2022 dollars |
| `artist` | STRING | Name of the artist/performer |
| `tour_title` | STRING | Title of the tour |
| `years` | STRING | Active year or range of years |
| `shows` | INTEGER | Total number of shows |
| `average_gross` | STRING | Average gross revenue per show |
| `ref` | STRING | Reference citation |
| `_etl_loaded_at` | TIMESTAMP | UTC ingestion timestamp |

## Project Structure
```
├── server/
│   ├── __init__.py
│   ├── config.py                 # Configuration and environment mappings
│   ├── main.py                   # Main CLI / Job entrypoint
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── extract.py            # GCS stream extractor
│   │   ├── transform.py          # Normalization & circuit breaker
│   │   ├── load.py               # BigQuery batch loader
│   │   └── observability.py      # Structured JSON logger & metrics
│   ├── schemas/
│   │   └── viswa_schema.json     # BigQuery table schema
│   ├── sql/
│   │   └── ddl/
│   │       └── viswa.sql         # BigQuery DDL
│   └── tests/
│       ├── __init__.py
│       ├── test_extract.py
│       ├── test_transform.py
│       └── test_load.py
├── dags/
│   └── scrum_322_viswa_dag.py    # Airflow DAG definition
├── tests/
│   ├── __init__.py
│   └── test_scrum_322_pipeline.py
├── Dockerfile                    # Python 3.11 container for Cloud Run Job
├── env.deploy.json               # Environment configuration for deployment
├── requirements.txt
├── .env.example
└── README.md
```

## Local Development & Testing

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run test suite:
   ```bash
   pytest server/tests tests/
   ```

3. Run pipeline locally:
   ```bash
   python -m server.main
   ```
