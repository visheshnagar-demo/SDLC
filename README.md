# GCS to BigQuery ETL Pipeline (SCRUM-378)

Automated batch ETL pipeline that extracts tour revenue data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), performs data cleansing, strips footnote annotations, parses currency values, sorts records deterministically by `Rank` in ascending order, and loads them into BigQuery table `test02` within dataset `analytics` in project `upbeat-repeater-477110-q6`.

## Architecture Overview
- **Source**: GCS CSV Object `gs://sdlc-workspec-store/etl/data/my_file (1).csv`
- **Transformation Engine**: Python 3.11 with Pandas / PyArrow (Data cleaning, type casting, `ORDER BY Rank ASC`)
- **Destination**: BigQuery `upbeat-repeater-477110-q6.analytics.test02`
- **Execution Model**: Cloud Run Batch Job / Standalone Python runner

## Project Structure
```
├── Dockerfile
├── requirements.txt
├── env.deploy.json
├── transformation_spec.json
├── app.py
├── dags/
│   └── etl_dag.py
├── pipeline/
│   └── run_etl.py
├── schemas/
│   └── test02_schema.json
├── sql/
│   └── ddl/
│       └── test02.sql
├── server/
│   ├── __init__.py
│   └── etl/
│       ├── __init__.py
│       ├── extractor.py
│       ├── validator.py
│       ├── transformer.py
│       └── loader.py
└── tests/
    ├── test_etl.py
    └── test_etl_pipeline.py
```

## Local Development & Execution

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Tests
```bash
pytest
```

### 3. Run Pipeline Locally
```bash
python -m pipeline.run_etl
```
