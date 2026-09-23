# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-361)

An enterprise-grade, serverless batch ETL data pipeline that extracts data from Cloud SQL PostgreSQL, executes cleaning and transformation logic, and loads the sanitized dataset into Google BigQuery.

## 1. Overview
- **Source Database**: Google Cloud SQL PostgreSQL
  - **Instance Connection Name**: `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`
  - **Database**: `postgres`
  - **Source Table**: `test_data`
  - **Authentication**: IAM Database Authentication (`559906504681-compute@developer`)
- **Target Data Warehouse**: Google BigQuery
  - **GCP Project**: `upbeat-repeater-477110-q6`
  - **Dataset**: `analytics`
  - **Target Table**: `postgres_test2`
  - **Write Disposition**: `WRITE_TRUNCATE` (idempotent snapshot)
- **Runtime Model**: Serverless batch Cloud Run Job (Zero-idle container).

## 2. Directory Structure
```
├── Dockerfile                                 # Container build definition (batch job entrypoint)
├── README.md                                  # Documentation and runbook
├── env.deploy.json                            # Deployment environment configuration
├── requirements.txt                           # Python dependencies
├── transformation_spec.json                   # Transformation contract specification
├── dags/
│   └── postgres_to_bigquery_dag.py            # Reference Airflow DAG
├── pipeline/
│   ├── __init__.py
│   ├── extract.py                             # Extraction with Cloud SQL IAM connector
│   ├── transform.py                           # Sanitization, type coercion & quarantine logic
│   ├── load.py                                # BigQuery loading with pyarrow/DataFrame
│   ├── run_postgres_to_bigquery.py            # Standalone batch runner script
│   └── run_etl.py                             # Entrypoint wrapper
├── schemas/
│   └── postgres_test2_schema.json             # Target BigQuery table JSON schema
├── sql/
│   └── ddl/
│       └── postgres_test2.sql                 # Target BigQuery DDL
└── tests/
    ├── __init__.py
    ├── test_pipeline.py                       # Unit & transformation test suite
    └── test_postgres_to_bigquery_pipeline.py  # Pipeline syntax & config tests
```

## 3. Data Transformations & Cleaning Rules
1. **Column Standardization**: Convert column names to lowercase snake_case.
2. **Whitespace Sanitization**: Strip leading/trailing spaces from all string values.
3. **Null Normalization**: Standardize empty strings and NaN representations into proper SQL nulls.
4. **Numeric Sanitization**: Strip currency symbols and footnote annotations, then cast to numeric types.
5. **Timestamp Normalization**: Detect and parse date/timestamp strings into UTC standard timestamps.
6. **Row Quarantine & Circuit Breakers**: Drop fully-empty corrupted rows; activate circuit breaker if 100% of rows fail validation.
7. **Audit Telemetry**: Inject `ingested_at` audit timestamp on all successfully loaded records.

## 4. Execution Instructions

### Local Execution / Test
```bash
# Install dependencies
pip install -r requirements.txt

# Run test suite
pytest tests/
```

### Batch Container Run
```bash
# Run standalone pipeline
python -m pipeline.run_postgres_to_bigquery
```
