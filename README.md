# GCS to BigQuery ETL Pipeline (`analytics.test03`)

Automated batch ETL pipeline extracting CSV data from Google Cloud Storage, standardizing and cleansing columns, sorting deterministically by `rank` ascending, and loading into Google BigQuery (`upbeat-repeater-477110-q6.analytics.test03`).

## Architecture & Specifications
- **Source**: `gs://sdlc-workspec-store/etl/data/my_file (1).csv` (CSV format)
- **Target Data Warehouse**: Google BigQuery
  - Project: `upbeat-repeater-477110-q6`
  - Dataset: `analytics`
  - Table: `test03`
  - Write Disposition: `WRITE_TRUNCATE` (idempotent overwrite)
- **Transformations**:
  - Header normalization to `snake_case`
  - Type-safe integer parsing for `rank` and `shows`
  - Whitespace stripping and null normalization for string fields
  - Deterministic sort by `rank` in ascending order (nulls sorted last)
  - UTC ingestion timestamp appended (`ingested_at`)

## Project Structure
```
├── Dockerfile
├── README.md
├── env.deploy.json
├── env.deploy.yaml
├── requirements.txt
├── transformation_spec.json
├── dags/
│   └── test03_pipeline_dag.py
├── pipeline/
│   ├── run_test03_pipeline.py
│   └── test03_pipeline_README.md
├── schemas/
│   └── test03_schema.json
├── sql/
│   └── ddl/
│       └── test03.sql
└── tests/
    └── test_test03_pipeline_pipeline.py
```

## Local Execution

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
```bash
export GCP_PROJECT_ID="upbeat-repeater-477110-q6"
export BIGQUERY_DATASET="analytics"
export BIGQUERY_TABLE="test03"
export GCS_SOURCE_BUCKET="sdlc-workspec-store"
export GCS_SOURCE_PREFIX="etl/data/my_file (1).csv"
```

### 3. Run Pipeline
```bash
python -m pipeline.run_test03_pipeline
```

### 4. Run Tests
```bash
pytest tests/
```
