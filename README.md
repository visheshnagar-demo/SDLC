# SCRUM-325 ETL Pipeline: GCS CSV to BigQuery (`analytics.test1`)

## Overview
Automated ETL pipeline designed to ingest raw CSV data from Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`), sanitize column headers, normalize currency/footnotes, validate records against circuit-breaker thresholds, and load clean records into BigQuery table `upbeat-repeater-477110-q6.analytics.test1`.

## Architecture
- **Source:** Google Cloud Storage (`gs://sdlc-workspec-store/etl/data/my_file (1).csv`)
- **Execution Model:** Cloud Run Job (Batch container execution, zero scheduler dependency)
- **Transformation:** Python 3.11 with Pandas / PyArrow schema-on-read transformation
- **Target:** Google BigQuery (`upbeat-repeater-477110-q6.analytics.test1`)

## Directory Layout
```
├── Dockerfile
├── requirements.txt
├── env.deploy.json
├── transformation_spec.json
├── schemas/
│   └── test1_schema.json
├── sql/
│   └── ddl/
│       ├── test1.sql
│       └── create_test1.sql
├── dags/
│   └── test1_etl_dag.py
├── pipeline/
│   ├── __init__.py
│   ├── extractor.py
│   ├── transformer.py
│   ├── validator.py
│   ├── loader.py
│   ├── run_test1_etl.py
│   └── run_etl.py
└── tests/
    ├── __init__.py
    ├── test_extractor.py
    ├── test_transformer.py
    ├── test_validator.py
    ├── test_loader.py
    ├── test_pipeline.py
    └── test_test1_etl_pipeline.py
```

## Running Locally
```bash
pip install -r requirements.txt
pytest tests/
python -m pipeline.run_test1_etl
```

## Deployment
Deployed as a Google Cloud Run Job via Harness CI/CD.
Container entrypoint: `CMD ["python", "-m", "pipeline.run_test1_etl"]`
