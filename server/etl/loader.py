"""BigQuery Loading Module.
Loads cleaned pandas DataFrames into BigQuery with dataset verification and schema reconciliation.
"""
import json
import logging
import os
import sys
from typing import Optional, Any

try:
    import pandas as pd
except (ImportError, Exception):
    pd = None

from server.etl.config import Settings, get_settings

logger = logging.getLogger("server.etl.loader")


def load_data_to_bigquery(
    df: Any,
    settings: Optional[Settings] = None,
) -> int:
    """Loads transformed records into target BigQuery table."""
    if settings is None:
        settings = get_settings()

    if df is None or len(df) == 0:
        logger.warning("No records to load into BigQuery. Skipping load.")
        return 0

    if pd is None:
        raise RuntimeError("pandas is required for BigQuery loading")

    from google.cloud import bigquery
    from google.api_core.exceptions import NotFound

    project_id = settings.gcp_project_id
    dataset_id = settings.bigquery_dataset
    table_id = settings.bigquery_table
    table_ref = f"{project_id}.{dataset_id}.{table_id}" if project_id else f"{dataset_id}.{table_id}"

    logger.info("Initializing BigQuery client for project '%s'...", project_id)
    try:
        client = bigquery.Client(project=project_id) if project_id else bigquery.Client()
    except Exception as exc:
        logger.error("Failed to initialize BigQuery client: %s", exc)
        raise EnvironmentError(f"Could not connect to BigQuery: {exc}") from exc

    # Ensure dataset exists
    try:
        dataset_ref = client.dataset(dataset_id, project=project_id)
        try:
            client.get_dataset(dataset_ref)
        except NotFound:
            ds = bigquery.Dataset(dataset_ref)
            ds.location = settings.bq_location
            client.create_dataset(ds, exists_ok=True)
            logger.info("Created BigQuery dataset '%s' in location '%s'", dataset_id, settings.bq_location)
    except Exception as exc:
        logger.error("Dataset verification error for '%s': %s", dataset_id, exc)
        raise RuntimeError(f"BigQuery dataset verification failed: {exc}") from exc

    write_disposition = (
        bigquery.WriteDisposition.WRITE_APPEND
        if settings.write_mode.lower() == "append"
        else bigquery.WriteDisposition.WRITE_TRUNCATE
    )

    job_config = bigquery.LoadJobConfig(
        write_disposition=write_disposition,
        create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
    )

    schema_file = None
    for cand in [
        os.path.join("schemas", f"{table_id}_schema.json"),
        os.path.join("schemas", "postgres_test3_schema.json"),
        os.path.join("schemas", "target_table_schema.json"),
    ]:
        if os.path.isfile(cand):
            schema_file = cand
            break

    if schema_file:
        try:
            raw_schema = client.schema_from_json(schema_file)
            reconciled_schema = []
            for field in raw_schema:
                if field.name not in df.columns:
                    df[field.name] = None
                    reconciled_schema.append(
                        bigquery.SchemaField(
                            name=field.name,
                            field_type=field.field_type,
                            mode="NULLABLE",
                            description=field.description,
                        )
                    )
                else:
                    reconciled_schema.append(field)

            schema_col_names = {sf.name for sf in raw_schema}
            for col in df.columns:
                if col not in schema_col_names:
                    reconciled_schema.append(
                        bigquery.SchemaField(
                            name=col,
                            field_type="STRING",
                            mode="NULLABLE",
                            description=f"Auto-discovered column {col}",
                        )
                    )

            # Type safe casting before load
            for field in reconciled_schema:
                col = field.name
                f_type = field.field_type.upper()
                if col in df.columns:
                    try:
                        if f_type in ("INTEGER", "INT64"):
                            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
                        elif f_type in ("FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"):
                            df[col] = pd.to_numeric(df[col], errors="coerce")
                        elif f_type in ("TIMESTAMP", "DATETIME"):
                            df[col] = pd.to_datetime(df[col], errors="coerce", utc=True)
                        elif f_type in ("BOOLEAN", "BOOL"):
                            df[col] = df[col].map(
                                lambda v: True if str(v).strip().lower() in ("true", "1", "t", "yes")
                                else (False if str(v).strip().lower() in ("false", "0", "f", "no") else None)
                                if pd.notna(v) else None
                            ).astype("boolean")
                        elif f_type == "STRING":
                            df[col] = df[col].apply(lambda v: str(v) if pd.notna(v) else None)
                    except (ValueError, TypeError) as cast_err:
                        logger.warning("Casting column '%s' to '%s': %s", col, f_type, cast_err)

            job_config.schema = reconciled_schema
        except (IOError, ValueError, KeyError) as err:
            logger.warning("Could not apply schema file %s: %s; falling back to autodetect", schema_file, err)
            job_config.autodetect = True
    else:
        job_config.autodetect = True

    logger.info("Executing BigQuery load job into '%s'...", table_ref)
    try:
        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()
        logger.info("Successfully loaded %d records into BigQuery table '%s'", len(df), table_ref)
        return len(df)
    except Exception as exc:
        logger.error("BigQuery load_table_from_dataframe failed: %s", exc)
        raise RuntimeError(f"BigQuery load failed: {exc}") from exc
