# Pipeline: sales_orders

## Overview
Automated connector pipeline from **POSTGRESQL** to **BIGQUERY**.

- **Source System**: `source_system` (postgresql)
  - Mode: `full`
  - Cursor Field: `None`
- **Target System**: `destination_system` (bigquery)
  - Destination Table: `sales_analytics.fct_sales_orders`
  - Write Mode: `append`
  - Merge Keys: `[]`
- **Execution Mode**: Serverless One-Time Auto-Boot Task (Cloud Run port 8080)

## Serverless Cloud Run Auto-Boot Execution
When deployed to Cloud Run, `app.py` automatically executes the one-time ETL run on boot and serves live status at `http://<service-url>/status`.

## Running Locally on Demand
```bash
python -m pipeline.run_sales_orders --date $(date +%Y-%m-%d)
```
