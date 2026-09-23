"""BigQuery data loader module."""
import os
import logging
import pandas as pd

logger = logging.getLogger("pipeline.load")


def load_to_bigquery(staging_file: str) -> bool:
    """Loads transformed Parquet data into BigQuery."""
    if not os.path.exists(staging_file) or os.path.getsize(staging_file) == 0:
        logger.warning("Staging file %s is empty or missing. Skipping BigQuery load.", staging_file)
        return True

    project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCLOUD_PROJECT")
    dataset_id = os.getenv("BIGQUERY_DATASET", "analytics")
    table_id = os.getenv("BIGQUERY_TABLE", "postgres_test2")
    write_mode = os.getenv("WRITE_MODE", "overwrite")

    if not project_id:
        raise EnvironmentError("FATAL: GCP_PROJECT_ID or PROJECT_ID must be set for BigQuery loading.")

    from google.cloud import bigquery
    client = bigquery.Client(project=project_id)
    table_ref = f"{project_id}.{dataset_id}.{table_id}"

    df = pd.read_parquet(staging_file)

    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND if write_mode == "append" else bigquery.WriteDisposition.WRITE_TRUNCATE,
    )

    schema_file = None
    for cand in [
        os.path.join("schemas", "postgres_test2_schema.json"),
        os.path.join("schemas", "postgres_to_bigquery_schema.json"),
        os.path.join("schemas", "target_table_schema.json"),
    ]:
        if os.path.isfile(cand):
            schema_file = cand
            break

    if schema_file:
        job_config.schema = client.schema_from_json(schema_file)
        logger.info("Attached explicit schema from %s", schema_file)

    if write_mode == "append":
        job_config.schema_update_options = [
            bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
            bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
        ]

    job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
    job.result()

    if job.errors:
        raise RuntimeError(f"FATAL: BigQuery load job failed: {job.errors}")

    logger.info("Successfully loaded %d records into BigQuery: %s", len(df), table_ref)
    return True
