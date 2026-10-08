# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-430)

Production-grade ETL pipeline and microservice to extract raw data from Cloud SQL PostgreSQL, clean and normalize attributes, and load data into Google BigQuery.

## Architecture

- **Source**: Google Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, DB: `postgres`, Table: `test_data`)
- **Authentication**: Google Cloud SQL Python Connector with IAM Database Authentication (`559906504681-compute@developer`) over Private IP.
- **Transformations**: Whitespace trimming, null sanitization, ISO UTC timestamp parsing, status normalization, dead-letter quarantine, and circuit breaking.
- **Target**: Google BigQuery (`analytics.postgres_test5`) with schema reconciliation and append/truncate write dispositions.
- **Execution**: Standalone Cloud Run Job runner (`pipeline/run_postgres_to_bigquery_scrum_430.py`) and FastAPI service (`server/main.py`).

## File Structure

```
├── .env.example
├── Dockerfile
├── README.md
├── requirements.txt
├── env.deploy.json
├── env.deploy.yaml
├── transformation_spec.json
├── dags/
│   └── postgres_to_bigquery_scrum_430_dag.py
├── schemas/
│   └── postgres_test5_schema.json
├── sql/
│   └── ddl/
│       └── postgres_test5.sql
├── pipeline/
│   ├── run_postgres_to_bigquery_scrum_430.py
│   └── postgres_to_bigquery_scrum_430_README.md
├── server/
│   ├── __init__.py
│   ├── database.py
│   ├── extractor.py
│   ├── loader.py
│   ├── main.py
│   ├── transformer.py
│   ├── requirements.txt
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── etl_schemas.py
│   └── tests/
│       ├── __init__.py
│       └── test_etl_pipeline.py
└── tests/
    └── test_postgres_to_bigquery_scrum_430_pipeline.py
```

## Local Development & Testing

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run test suite:
   ```bash
   pytest
   ```
3. Run FastAPI server:
   ```bash
   python -m server.main
   ```
4. Execute batch run CLI:
   ```bash
   python -m server.main --run-etl
   # Or via pipeline runner
   python -m pipeline.run_postgres_to_bigquery_scrum_430
   ```
