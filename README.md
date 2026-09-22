# PostgreSQL to BigQuery ETL Pipeline (`test5`)

## 1. Overview
Production-grade data cleaning and ETL pipeline for **SCRUM-349**.
- **Source**: Cloud SQL PostgreSQL (`instance: sdlc-etl-demo-db`, `database: postgre`, `table: test_data`)
- **Target**: Google BigQuery (`project: upbeat-repeater-477110-q6`, `dataset: analytics`, `table: test5`)
- **Execution Mode**: Decoupled Staging / Cloud Run Job batch runner

## 2. Fundamental Transformations Applied
- **Whitespace Sanitization**: Trims leading and trailing whitespace on all string fields (`id`, `status`, `raw_data`).
- **Null Normalization**: Standardizes sentinel null strings (`"nan"`, `"none"`, `"null"`, `"n/a"`, `""`) to native SQL `NULL`.
- **Numeric Casting**: Normalizes numeric values with currency/separator stripping into BigQuery `FLOAT64`.
- **Timestamp Standardization**: Parses timestamps into UTC ISO 8601 timestamps (`TIMESTAMP`).
- **Audit Fields**: Adds `ingested_at` timestamp tracking ingestion time.
- **Fail-Fast & Zero-Mock Policy**: Strict validation with zero mock data and circuit breaker halting upon 100% invalid rows.

## 3. Project Structure
```
├── Dockerfile                                  # Python 3.11 container entrypoint for Cloud Run Job
├── env.deploy.json                             # Production deployment configuration
├── requirements.txt                            # Pipeline runtime dependencies
├── transformation_spec.json                    # Schema mapping and transformation rules
├── dags/
│   ├── __init__.py
│   └── postgres_to_bigquery_test5_dag.py       # Airflow orchestration DAG
├── pipeline/
│   ├── __init__.py
│   └── run_postgres_to_bigquery_test5.py       # Standalone batch job runner
├── schemas/
│   └── test5_schema.json                       # BigQuery JSON schema definition
├── sql/
│   └── ddl/
│       └── test5.sql                           # BigQuery DDL definition
└── tests/
    ├── __init__.py
    └── test_postgres_to_bigquery_test5_pipeline.py # Pytest test suite
```

## 4. Local Execution & Testing
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run unit tests
pytest tests/

# 3. Execute batch runner locally
python -m pipeline.run_postgres_to_bigquery_test5
```
