# test04 ETL Pipeline

Serverless batch ETL pipeline that ingests concert tour data from Google Cloud Storage, applies schema normalization and rank sorting (`ORDER BY rank ASC`), and loads the results into Google Cloud BigQuery.

## Target BigQuery Location
- **Project**: `upbeat-repeater-477110-q6`
- **Dataset**: `analytics`
- **Table**: `test04`

## Source GCS Location
- **Bucket**: `sdlc-workspec-store`
- **File**: `etl/data/my_file (1).csv`

## Architecture & Components
- **Extractor** (`pipeline/extractor.py`): Ingests CSV data from GCS bucket.
- **Transformer** (`pipeline/transformer.py`): Normalizes column headers, casts types, sorts by `rank` ASC, and injects `ingestion_timestamp`.
- **Loader** (`pipeline/loader.py`): Reconciles schema against `schemas/test04_schema.json` and writes into BigQuery using `WRITE_TRUNCATE`.
- **Runner** (`pipeline/run_test04_etl.py`): Standalone batch execution script.
- **Entrypoint** (`main.py`): Cloud Run Job entrypoint.

## Local Execution
```bash
pip install -r requirements.txt
python main.py
```

## Running Tests
```bash
pytest tests/ -v
```
