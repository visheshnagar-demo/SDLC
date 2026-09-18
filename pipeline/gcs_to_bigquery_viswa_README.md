# Pipeline: gcs_to_bigquery_viswa

## Overview
Automated connector pipeline from **GCS** to **BIGQUERY**.

- **Source System**: `source_system` (gcs)
  - Mode: `full`
  - Cursor Field: `None`
- **Target System**: `destination_system` (bigquery)
  - Destination Table: `analytics.viswa`
  - Write Mode: `overwrite`
  - Merge Keys: `['record_id']`
- **Execution Mode**: Serverless One-Time Auto-Boot Task (Cloud Run port 8080)

## Serverless Cloud Run Auto-Boot Execution
When deployed to Cloud Run, `app.py` automatically executes the one-time ETL run on boot and serves live status at `http://<service-url>/status`.

## Running Locally on Demand
```bash
python -m pipeline.run_gcs_to_bigquery_viswa --date $(date +%Y-%m-%d)
```
