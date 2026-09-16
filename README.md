# Sales Data ETL Pipeline (PostgreSQL to BigQuery)

## Overview
This service extracts raw sales transaction data from a PostgreSQL database (`raw_sales_orders`), filters out records with invalid emails or missing/invalid amounts, transforms the data into BigQuery analytics format, and loads it into a date-partitioned BigQuery table (`fct_sales_orders`).

## Architecture & Data Flow
1. **Extractor**: Extracts records from `raw_sales_orders` with batch chunking and retry mechanisms.
2. **Validator**: Validates records against RFC 5322 email regex and positive non-null amount criteria. Records failing validation are quarantined and logged with audit reasons.
3. **Transformer**: Standardizes types, formats timestamps to UTC, and constructs analytics payload.
4. **Loader**: Ingests cleansed records into BigQuery table `fct_sales_orders` partitioned by `order_date` (DAY granularity) and clustered by `customer_id, status`.

## Configuration
Configure the following environment variables (or create a `.env` file):
- `DATABASE_URL`: PostgreSQL connection string (defaults to SQLite in development/test).
- `ALLOWED_ORIGINS`: Comma-separated or JSON list of allowed CORS origins.
- `BIGQUERY_PROJECT`: Google Cloud project ID.
- `BIGQUERY_DATASET`: Target BigQuery dataset (default: `sales_analytics`).
- `BIGQUERY_TABLE`: Target BigQuery table (default: `fct_sales_orders`).

## REST API Endpoints
- `POST /api/v1/pipeline/run` (or `/api/v1/pipeline/trigger`): Triggers batch ETL execution.
- `GET /api/v1/health`: Checks health of database and BigQuery connections.
- `GET /health`: Basic health check.

## Testing & Validation
Run tests locally with pytest:
```bash
pytest
```
