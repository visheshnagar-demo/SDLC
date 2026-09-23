# PostgreSQL to BigQuery ETL Data Cleaning & Ingestion Pipeline (`SCRUM-351`)

This repository contains the production-grade ETL pipeline that extracts raw data from PostgreSQL (`instance: sdlc-etl-demo-db`, `database: postgre`, `table: test_data`), performs fundamental data cleaning and transformations, and loads the validated dataset into Google Cloud BigQuery (`project: upbeat-repeater-477110-q6`, `dataset: analytics`, `table: test6`).

---

## 1. Pipeline Architecture

- **Source**: PostgreSQL (`sdlc-etl-demo-db.postgre.test_data`)
- **Staging / Processing**: Pandas / PyArrow in-memory transformation & Parquet staging
- **Target Sink**: BigQuery (`upbeat-repeater-477110-q6.analytics.test6`)
- **Deployment**: Standalone Google Cloud Run Job & FastAPI Service

### Data Cleaning & Transformations
- Whitespace trimming across all string/text attributes.
- Null sanitization (converting `"null"`, `"None"`, `"N/A"`, `""`, `"NaN"` to `None` / SQL `NULL`).
- Numeric coercion with currency/thousands separator stripping.
- ISO 8601 UTC timestamp standardization for datetime columns.
- Primary key deduplication keeping latest valid records.
- Ingestion metadata tracking with `_etl_loaded_at`.

---

## 2. Directory Structure

```
├── Dockerfile
├── README.md
├── env.deploy.json
├── env.deploy.yaml
├── requirements.txt
├── transformation_spec.json
├── dags/
│   └── postgres_to_bigquery_test6_dag.py
├── pipeline/
│   ├── run_postgres_to_bigquery_test6.py
│   └── postgres_to_bigquery_test6_README.md
├── schemas/
│   └── test6_schema.json
├── sql/
│   └── ddl/
│       └── test6.sql
├── server/
│   ├── __init__.py
│   ├── main.py
│   ├── requirements.txt
│   └── etl/
│       ├── __init__.py
│       ├── extractor.py
│       ├── loader.py
│       ├── logger.py
│       ├── main.py
│       └── transformer.py
└── tests/
    ├── __init__.py
    ├── test_etl_pipeline.py
    └── test_postgres_to_bigquery_test6_pipeline.py
```

---

## 3. Local Execution

### Prerequisites
- Python 3.11+
- Google Cloud SDK authenticated or Service Account configured

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run Pipeline (Standalone Batch Job)
```bash
python -m pipeline.run_postgres_to_bigquery_test6
```

### Run FastAPI Server
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run Tests
```bash
pytest tests/ -v
```
