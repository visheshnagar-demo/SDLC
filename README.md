# Cloud SQL PostgreSQL to BigQuery ETL Data Pipeline (SCRUM-392)

Enterprise ETL pipeline designed to extract transactional records from Google Cloud SQL PostgreSQL (`postgres.public.test_data`), clean and normalize data in-flight, and load sanitized records into Google BigQuery (`analytics.postgres_test3`).

---

## 1. Architecture Overview

- **Source**: Google Cloud SQL PostgreSQL (`upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db`, Database: `postgres`, Table: `test_data`)
- **Authentication**: IAM Database Authentication via Google Cloud SQL Python Connector (`559906504681-compute@developer`) over Private IP.
- **Transformation Engine**: Schema standardization, whitespace trimming, null-sentinel neutralization, UTC datetime normalization, and validation circuit breaker.
- **Destination**: Google BigQuery (`upbeat-repeater-477110-q6:analytics.postgres_test3`) with schema reconciliation.
- **Compute Runtime**: Cloud Run Job container execution (zero-idle, zero-scheduler).

---

## 2. Directory Layout

```
├── dags/
│   └── postgres_to_bigquery_test_data_dag.py
├── pipeline/
│   ├── run_postgres_to_bigquery_test_data.py
│   └── postgres_to_bigquery_test_data_README.md
├── schemas/
│   └── postgres_test3_schema.json
├── sql/
│   └── ddl/
│       └── postgres_test3.sql
├── server/
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── extractor.py
│   │   ├── transformer.py
│   │   ├── loader.py
│   │   └── pipeline.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_extractor.py
│   │   ├── test_transformer.py
│   │   ├── test_loader.py
│   │   └── test_pipeline.py
│   ├── main.py
│   └── requirements.txt
├── tests/
│   └── test_postgres_to_bigquery_test_data_pipeline.py
├── Dockerfile
├── requirements.txt
├── env.deploy.json
├── transformation_spec.json
└── README.md
```

---

## 3. Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | GCP Project ID | `upbeat-repeater-477110-q6` |
| `GCP_REGION` | GCP Region | `us-central1` |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL Instance Connection Name | `upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db` |
| `POSTGRES_DB` | Source PostgreSQL Database | `postgres` |
| `POSTGRES_USER` | IAM Service Account Database User | `559906504681-compute@developer` |
| `CLOUD_SQL_IP_TYPE` | Cloud SQL IP Routing (`PRIVATE` or `PUBLIC`) | `PRIVATE` |
| `SOURCE_TABLE` | Source PostgreSQL Table Name | `test_data` |
| `BIGQUERY_DATASET` | Target BigQuery Dataset | `analytics` |
| `BIGQUERY_TABLE` | Target BigQuery Table | `postgres_test3` |

---

## 4. Execution

### Local Python Execution
```bash
python -m pipeline.run_postgres_to_bigquery_test_data
# or
python -m server.etl.pipeline
```

### Running Tests
```bash
pytest server/tests tests/ -v
```

### Docker Execution
```bash
docker build -t etl-postgres-to-bigquery:latest .
docker run --rm --env-file .env etl-postgres-to-bigquery:latest
```
