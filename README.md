# Cloud SQL PostgreSQL to BigQuery ETL Pipeline (SCRUM-376)

Production-grade ETL pipeline designed to extract transactional records from Cloud SQL PostgreSQL (`test_data`), apply rigorous data cleaning transformations (whitespace trimming, null normalization, deduplication, timestamp formatting), and load cleansed records into Google BigQuery (`analytics.postgres_test3`).

---

## 1. Architecture Overview

- **Source**: Google Cloud SQL PostgreSQL
  - Instance: `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`
  - Database: `postgres`
  - Table: `test_data`
  - Auth: IAM Database Authentication (`559906504681-compute@developer`)
  - Connection: Private IP via Cloud SQL Python Connector
- **Transformation Engine**: Python 3.11 / Pandas
  - Whitespace sanitization across text columns
  - Null representation normalization (`"NULL"`, `"None"`, `"NaN"`, `""` &rarr; `None`)
  - Deduplication on primary key `id`
  - UTC ISO-8601 timestamp coercion
  - Audit metadata enrichment (`_etl_loaded_at`)
- **Target Sink**: Google BigQuery
  - Project: `upbeat-repeater-477110-q6`
  - Dataset: `analytics`
  - Table: `postgres_test3`
  - Partitioning: `DATE(_etl_loaded_at)`
  - Clustering: `id`

---

## 2. Directory Layout

```
├── Dockerfile                      # Python 3.11 batch container definition
├── README.md                       # Documentation & run instructions
├── requirements.txt                # Python runtime dependencies
├── env.deploy.json                 # Cloud Run Job runtime configuration
├── transformation_spec.json        # Column mapping and transform specification
├── .env.example                    # Local environment variable template
├── pipeline/
│   ├── __init__.py
│   ├── cleaner.py                  # Data cleaning and transformation logic
│   ├── extractor.py                # Cloud SQL IAM connector and extraction
│   ├── loader.py                   # BigQuery ingestion module
│   ├── logger.py                   # Structured JSON logger
│   └── run_pipeline.py             # Main entrypoint script
├── schemas/
│   ├── __init__.py
│   └── postgres_test3_schema.json  # BigQuery table schema
├── sql/
│   └── ddl/
│       └── postgres_test3.sql      # BigQuery DDL
├── dags/
│   └── postgres_to_bigquery_pipeline.py # Optional Airflow DAG
└── tests/
    ├── __init__.py
    └── test_pipeline.py            # Unit & integration test suite
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env` or inject variables at container runtime:

| Variable | Description | Example |
|---|---|---|
| `INSTANCE_CONNECTION_NAME` | Cloud SQL instance connection string | `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db` |
| `POSTGRES_DB` | Source PostgreSQL database | `postgres` |
| `POSTGRES_USER` | IAM Service Account email prefix | `559906504681-compute@developer` |
| `CLOUD_SQL_IP_TYPE` | Cloud SQL IP mode | `PRIVATE` |
| `SOURCE_TABLE` | Source table name | `test_data` |
| `GCP_PROJECT` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `BQ_DATASET` | BigQuery target dataset | `analytics` |
| `BQ_TABLE` | BigQuery target table | `postgres_test3` |
| `CHUNK_SIZE` | Batch extraction chunk size | `10000` |

---

## 4. Local Execution & Testing

### Running Tests
```bash
pytest tests/ -v
```

### Running Pipeline Directly
```bash
python -m pipeline.run_pipeline
```

---

## 5. Container Execution (Cloud Run Job)

Build and run container:
```bash
docker build -t postgres-to-bigquery-etl .
docker run --env-file .env postgres-to-bigquery-etl
```
