"""BigQuery loading module for Sales Order ETL."""
import os
import logging
import pandas as pd
from google.cloud import bigquery

logger = logging.getLogger(__name__)

def load_to_bigquery(df: pd.DataFrame, target_table_ref: str = None) -> bool:
    """Loads cleaned DataFrame into target partitioned BigQuery table."""
    if df.empty:
        logger.warning("Empty DataFrame provided. Skipping load.")
        return True

    project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID") or "upbeat-repeater-477110-q6"
    dataset_id = os.getenv("BIGQUERY_DATASET", "analytics")
    table_id = os.getenv("BIGQUERY_TABLE", "harshada-test3")

    if not target_table_ref:
        target_table_ref = f"{project_id}.{dataset_id}.{table_id}"

    logger.info("Loading %d records into BigQuery table: %s", len(df), target_table_ref)

    client = bigquery.Client(project=project_id)
    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        time_partitioning=bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="order_date",
        ),
        schema_update_options=[
            bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
            bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
        ],
    )

    schema_file = os.path.join("schemas", "sales_order_schema.json")
    if os.path.exists(schema_file):
        job_config.schema = client.schema_from_json(schema_file)

    job = client.load_table_from_dataframe(df, target_table_ref, job_config=job_config)
    job.result()

    if job.errors:
        raise RuntimeError(f"BigQuery load job failed: {job.errors}")

    logger.info("Successfully loaded %d records into BigQuery table %s", len(df), target_table_ref)
    return True
