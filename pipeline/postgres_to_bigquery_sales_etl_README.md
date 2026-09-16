# PostgreSQL to BigQuery Sales ETL Pipeline

## Overview
This production ETL pipeline extracts sales orders from the PostgreSQL `raw_sales_orders` table, performs schema validation and data cleansing (filtering out invalid email formats and null/non-positive monetary amounts), routes bad records to a dead-letter quarantine manager, and loads cleaned records into Google BigQuery partitioned by `order_date`.

- **Source**: PostgreSQL (`raw_sales_orders`)
- **Cleansing Rules**:
  - `amount`: Non-null numeric value > 0.0
  - `customer_email`: RFC-5322 regex validation (`^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$`)
  - `order_date`: Valid date (ISO-8601)
  - `order_id`: Non-empty primary key
- **Target Table**: `dev_sales.fct_sales_orders_v1`
- **Partitioning**: Day-based on `order_date`
- **Clustering**: `customer_id`, `status`

## Execution

### Standalone / Cloud Run Job
```bash
python -m pipeline.run_postgres_to_bigquery_sales_etl --source-table raw_sales_orders --target-dataset dev_sales --target-table fct_sales_orders_v1
```

### Environment Variables
- `POSTGRES_DB_URL` / `DATABASE_URL`: PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`)
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `BIGQUERY_DATASET`: Target dataset name (`dev_sales`)
- `BIGQUERY_TABLE`: Target table name (`fct_sales_orders_v1`)

### Testing
```bash
pytest tests/test_postgres_to_bigquery_sales_etl_pipeline.py -v
```
