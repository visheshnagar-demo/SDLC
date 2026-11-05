# Project Features

## SCRUM-300 - Build Daily Batch ETL Data Pipeline Deployed as Cloud Run Job

### Feature Summary
As a Data Engineer / Analytics User, I want to automatically ingest daily sales order CSV files from GCS, clean/deduplicate records, and load them into a partitioned BigQuery table analytics.new_sales_orders so that reliable sales data is available for downstream analytics.

### Key Features
- Daily batch ETL pipeline running as a Cloud Run Job
- GCS CSV data ingestion from gs://sdlc-workspec-store/etl/data/raw_sales_data.csv
- Record cleaning and deduplication on unique order identifiers
- Data loading into partitioned BigQuery table analytics.new_sales_orders
