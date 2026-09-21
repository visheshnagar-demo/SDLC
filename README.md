# SCRUM-333: ETL Data Pipeline (GCS to BigQuery)

## Overview
Automated ETL pipeline designed to ingest CSV transactional datasets from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/test_dynamic_etl_gmt.csv`), apply deterministic business transformations, and load the resulting dataset into Google BigQuery table `test3` within dataset `analytics` under GCP project `upbeat-repeater-477110-q6`.

## Transformations Implemented
1. **Rank Sorting**:
   - Casts the `rank` field into numeric values.
   - Sorts records in ascending order.
   - Positions invalid, non-numeric (e.g. `'a'`), or missing values at the end (`NULLS LAST`).
2. **Currency Conversion (USD to INR)**:
   - Sanitizes `amount` values (removes currency symbols, commas).
   - Multiplies USD amounts by the runtime exchange rate (default: `83.50` or configured via `EXCHANGE_RATE`).
   - Generates `amount_inr` and records `exchange_rate`.
3. **GMT to IST Timezone Conversion & Splitting**:
   - Parses GMT/UTC timestamps from `us_time`.
   - Converts timestamps into Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
   - Splits into `indian_date` (`YYYY-MM-DD`) and `indian_time` (`HH:MM:SS`).
4. **Audit Trail**:
   - Populates `ingested_at` with current UTC timestamp.

## Project Structure
```
├── app.py                         # Root execution entry point
├── dags/
│   └── test3_etl_dag.py           # Airflow DAG for orchestration
├── Dockerfile                     # Cloud Run Job container specification
├── env.deploy.json                # Deployment environment configuration
├── openapi.json                   # OpenAPI 3.0 specification & schema contract
├── pipeline/
│   ├── __init__.py
│   ├── extractor.py               # GCS extraction module
│   ├── transformer.py             # Business transformations module
│   ├── loader.py                  # BigQuery loading module
│   ├── run_etl.py                 # Standalone ETL pipeline runner
│   └── run_test3_etl.py           # Connector runner script
├── requirements.txt               # Dependencies
├── schemas/
│   └── test3_schema.json          # Target BigQuery schema JSON
├── sql/
│   └── ddl/
│       └── test3.sql              # Target BigQuery DDL
├── tests/
│   ├── __init__.py
│   ├── test_etl_pipeline.py       # Transformation & unit tests
│   └── test_test3_etl_pipeline.py # Connector & syntax tests
└── transformation_spec.json       # Persisted transformation specification
```

## Local Execution
```bash
# Install dependencies
pip install -r requirements.txt

# Run unit tests
pytest tests/

# Execute pipeline
python -m pipeline.run_etl
```

## Cloud Run Job Deployment
Packaged as a serverless container executed via Cloud Run Job.
No idle HTTP server or long-running scheduler is required.
