# Pipeline: postgres_to_bigquery_test_data

## Overview
Automated connector pipeline from **POSTGRESQL** to **BIGQUERY**.

- **Source System**: `source_system` (postgresql)
  - Mode: `full`
  - Cursor Field: `None`
- **Target System**: `destination_system` (bigquery)
  - Destination Table: `analytics.postgres_test3`
  - Write Mode: `overwrite`
  - Merge Keys: `[]`
- **Execution Mode**: Cloud Run Job (one-time batch execution)

## Cloud Run Job Execution
When deployed by the DevOps Agent, a Cloud Run Job is created and **immediately executed**.
The container boots, runs `python -m pipeline.run_postgres_to_bigquery_test_data`, loads data into the
target, and exits with code 0 (success) or 1 (failure). No idle container overhead.

### How It Works
1. DevOps Agent builds the Docker image via Cloud Build and pushes to Artifact Registry.
2. A Cloud Run Job is created (or updated) pointing at the image.
3. The Job is executed immediately — the container runs the ETL and exits.
4. Data is available in the target (BIGQUERY) as soon as the Job completes.

## Running Locally
```bash
python -m pipeline.run_postgres_to_bigquery_test_data --date $(date +%Y-%m-%d)
```

## Re-running the Pipeline
```bash
gcloud run jobs execute postgres_to_bigquery_test_data --region us-central1
```
