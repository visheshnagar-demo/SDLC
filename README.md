# Sales Order ETL Pipeline (SCRUM-362)

## Overview
This repository contains the production-ready batch ETL pipeline for ingesting sales order CSV data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`), cleaning and deduplicating records, and loading them into a partitioned BigQuery table (`analytics.harshada-test3`).

The pipeline is packaged as a serverless **Cloud Run Job** for zero-idle container execution.

## Pipeline File Structure
```
├── app.py
├── Dockerfile
├── requirements.txt
├── env.deploy.json
├── transformation_spec.json
├── pipeline/
│   ├── __init__.py
│   ├── config.py
│   ├── ingest.py
│   ├── cleaner.py
│   ├── deduplicator.py
│   ├── loader.py
│   └── run_sales_etl.py
├── schemas/
│   ├── sales_order_schema.json
│   └── sales_etl_schema.json
├── sql/
│   └── ddl/
│       ├── sales_orders.sql
│       └── sales_etl.sql
├── tests/
│   ├── __init__.py
│   ├── test_pipeline.py
│   └── test_sales_etl_pipeline.py
└── README.md
```

## Running Locally

### Prerequisites
- Python 3.11+
- Google Cloud SDK (`gcloud`) with credentials configured for GCP Project `upbeat-repeater-477110-q6`

### Execute Pipeline
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run ETL pipeline
python -m pipeline.run_sales_etl
```

### Run Automated Tests
```bash
pytest tests/
```
