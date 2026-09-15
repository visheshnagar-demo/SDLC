# PostgreSQL to BigQuery Sales ETL Pipeline (SCRUM-284)

ETL pipeline extracting sales orders from PostgreSQL `raw_sales_orders`, validating data quality (RFC 5322 emails, non-null positive amounts), and loading into BigQuery `dev_sales.fct_sales_orders_v1` partitioned by `order_date`.

## Execution
- Standalone Batch: `python -m pipeline.run_postgres_to_bigquery_sales`
- Web Service: `uvicorn server.main:app --port 8000`
- Tests: `pytest`
