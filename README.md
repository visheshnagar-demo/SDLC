# Sales Order ETL Pipeline (SCRUM-362)

## Overview
This repository contains the production-ready batch ETL pipeline for ingesting sales order CSV data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleaning and deduplicating records, and loading them into a partitioned BigQuery table (`analytics.harshada-test3`).

The pipeline is packaged as a serverless **Cloud Run Job** for zero-idle container execution.

## Architecture & Data Flow
1. **Source Extraction**: Streams raw CSV files from GCS bucket `sdlc-workspec-store`.
2. **Transformations & Quality Checks**:
   - Cleans and normalizes text fields (trims whitespace, handles null representations).
   - Coerces numeric fields (`amount` to `FLOAT64`).
   - Standardizes timestamps (`created_at` to `TIMESTAMP` in UTC).
   - Derives `order_date` (`DATE`) for BigQuery partition key.
   - Deduplicates records on primary key `order_id`, keeping the record with the latest `created_at`.
   - Adds lineage timestamp metadata (`_ingested_at`).
   - Circuit breaker threshold: fails fast if 100% of rows fail validation.
3. **Target Load**: Loads clean data into BigQuery dataset `analytics`, table `harshada-test3` partitioned by `DAY(order_date)` and clustered by `order_id`.

## Pipeline File Structure
```
├── dags/
│   └── sales_etl_dag.py
├── pipeline/
│   ├── __init__.py
│   └── run_sales_etl.py
├── schemas/
│   └── harshada-test3_schema.json
├── sql/
│   └── ddl/
│       └── harshada-test3.sql
├── tests/
│   ├── __init__.py
│   └── test_sales_etl_pipeline.py
├── Dockerfile
├── env.deploy.json
├── requirements.txt
├── transformation_spec.json
└── README.md
```

## Running Locally

### Prerequisites
- Python 3.11+
- Google Cloud SDK (`gcloud`) with credentials configured for GCP Project `upbeat-repeater-477110-q6`

### Execute Pipeline
```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run ETL standalone runner
python -m pipeline.run_sales_etl
```

### Run Automated Tests
```bash
pytest tests/
```

## Cloud Run Job Container Build
```bash
docker build -t gar-repo/sales-etl:latest .
docker run --rm \
  -e GCS_SOURCE_BUCKET="sdlc-workspec-store" \
  -e GCS_SOURCE_PREFIX="etl/data/" \
  -e BIGQUERY_DATASET="analytics" \
  -e BIGQUERY_TABLE="harshada-test3" \
  gar-repo/sales-etl:latest
```
