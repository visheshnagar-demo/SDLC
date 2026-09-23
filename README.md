# Cloud Run Job ETL Pipeline: Sales Orders Ingestion

An enterprise batch ETL data pipeline deployed as a GCP Cloud Run Job. Ingests sales order CSV records from Google Cloud Storage, validates, cleans, deduplicates, and loads them into a partitioned BigQuery table.

## Architecture

- **Ingestion**: Fetches raw sales order CSV files from `gs://sdlc-workspec-store/etl/data/raw_sales_data.csv`.
- **Validation**: Schema-on-read validation with fail-fast circuit breakers for empty or corrupted datasets.
- **Transformation**: String whitespace trimming, type coercion, UTC timestamp normalization, and partition field extraction (`order_date`).
- **Deduplication**: Deduplicates records by primary key (`order_id`) retaining the latest record.
- **Load**: Loads clean DataFrames into BigQuery table `analytics.harshada-test2` with daily partitioning on `order_date` and clustering on `customer_id`, `product_category`.
- **Observability**: Structured JSON logging and audit execution summaries.

## Directory Structure

```
├── app.py                      # Main Cloud Run Job entrypoint
├── Dockerfile                  # Container image build specification
├── env.deploy.json             # Deployment environment configuration
├── pipeline/
│   ├── __init__.py
│   ├── ingestor.py             # GCS raw CSV extractor
│   ├── validator.py            # Data validation and circuit breaker
│   ├── transformer.py          # Field transformations & derived fields
│   ├── deduplicator.py         # Primary key deduplication
│   ├── loader.py               # Partitioned BigQuery loader
│   ├── logger.py               # Structured JSON logger
│   └── run_sales_etl.py        # Pipeline execution workflow runner
├── schemas/
│   ├── sales_schema.json       # BigQuery schema JSON
│   └── harshada-test2_schema.json
├── sql/
│   └── ddl/
│       ├── sales_orders.sql    # BigQuery target table DDL
│       └── harshada-test2.sql
├── tests/
│   ├── __init__.py
│   ├── test_etl_pipeline.py    # Unit & transformation tests
│   └── test_sales_etl_pipeline.py # Integration test suite
├── transformation_spec.json   # Transformation specification
├── requirements.txt            # Python dependencies
└── README.md                   # Pipeline documentation
```

## Local Execution

Run pipeline tests locally:
```bash
pytest tests/
```

Run ETL pipeline with local CSV override:
```bash
python app.py
```

## Deployment Configuration (`env.deploy.json`)

```json
{
  "GCS_SOURCE_BUCKET": "sdlc-workspec-store",
  "GCS_SOURCE_PREFIX": "etl/data/raw_sales_data.csv",
  "BIGQUERY_DATASET": "analytics",
  "BIGQUERY_TABLE": "harshada-test2"
}
```
