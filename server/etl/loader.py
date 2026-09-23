"""BigQuery Loader Module."""
import os
import pandas as pd
from server.etl.logger import get_logger

logger = get_logger("loader")


def load_to_bigquery(
    df: pd.DataFrame,
    project_id: str = None,
    dataset_id: str = "analytics",
    table_id: str = "test6",
    write_disposition: str = "WRITE_TRUNCATE",
) -> int:
    """Loads a pandas DataFrame into Google Cloud BigQuery.
    
    Returns the number of rows successfully loaded.
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to loader. Skipping BigQuery load.")
        return 0

    project = (
        project_id
        or os.getenv("GCP_PROJECT_ID")
        or os.getenv("PROJECT_ID")
        or os.getenv("GOOGLE_CLOUD_PROJECT")
        or "upbeat-repeater-477110-q6"
    )
    dataset = dataset_id or os.getenv("BIGQUERY_DATASET") or "analytics"
    table = table_id or os.getenv("BIGQUERY_TABLE") or "test6"

    if not project:
        raise EnvironmentError("GCP_PROJECT_ID must be configured for BigQuery loading.")

    from google.cloud import bigquery
    client = bigquery.Client(project=project)
    table_ref = f"{project}.{dataset}.{table}"

    disposition = (
        bigquery.WriteDisposition.WRITE_APPEND
        if write_disposition.upper() == "WRITE_APPEND"
        else bigquery.WriteDisposition.WRITE_TRUNCATE
    )

    job_config = bigquery.LoadJobConfig(
        write_disposition=disposition,
    )

    schema_file = None
    for cand in [
        os.path.join("schemas", "test6_schema.json"),
        os.path.join("schemas", "postgres_to_bigquery_test6_schema.json"),
    ]:
        if os.path.isfile(cand):
            schema_file = cand
            break

    if schema_file:
        try:
            job_config.schema = client.schema_from_json(schema_file)
            logger.info("Loaded schema from %s", schema_file)
        except Exception as schema_err:
            logger.error("Failed to parse BigQuery schema from %s: %s", schema_file, schema_err)
            raise RuntimeError(f"Invalid schema in {schema_file}: {schema_err}") from schema_err

    logger.info("Submitting BigQuery Load Job for table: %s with %d rows", table_ref, len(df))
    job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
    job.result()

    if job.errors:
        raise RuntimeError(f"BigQuery load job encountered errors: {job.errors}")

    logger.info("Successfully loaded %d rows to %s", len(df), table_ref)
    return len(df)
