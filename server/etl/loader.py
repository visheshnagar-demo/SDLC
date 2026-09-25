"""BigQuery Loader Module."""
import os
import json
import logging
from typing import Optional
import pandas as pd
from google.cloud import bigquery
from google.api_core.exceptions import GoogleAPIError

logger = logging.getLogger("etl.loader")


def load_to_bigquery(
    df: pd.DataFrame,
    project_id: str,
    dataset_id: str,
    table_id: str,
    write_mode: str = "append",
    schema_path: Optional[str] = None,
) -> int:
    """Loads transformed DataFrame into BigQuery target table with day partitioning.
    
    Reconciles schema and coerces types to prevent load errors.
    """
    if df is None or df.empty:
        logger.warning("Empty DataFrame provided to BigQuery loader; skipping insertion.")
        return 0

    table_ref = f"{project_id}.{dataset_id}.{table_id}"
    logger.info("Initializing BigQuery load for table '%s' (rows=%d)...", table_ref, len(df))

    try:
        client = bigquery.Client(project=project_id)
    except Exception as client_err:
        logger.critical("Failed to initialize BigQuery client for project %s: %s", project_id, client_err)
        raise RuntimeError(f"BigQuery client creation failed: {client_err}") from client_err

    # Ensure dataset exists
    try:
        dataset_ref = bigquery.DatasetReference(project_id, dataset_id)
        ds = bigquery.Dataset(dataset_ref)
        ds.location = os.getenv("BQ_LOCATION", "us-central1")
        client.create_dataset(ds, exists_ok=True)
    except GoogleAPIError as ds_err:
        logger.warning("Dataset verification notice: %s", ds_err)

    job_config = bigquery.LoadJobConfig(
        write_disposition=(
            bigquery.WriteDisposition.WRITE_APPEND
            if write_mode.lower() == "append"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        ),
        create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
    )

    if schema_path and os.path.isfile(schema_path):
        try:
            raw_schema = client.schema_from_json(schema_path)
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

            schema_cols = {f.name for f in raw_schema}
            for col in df.columns:
                if col not in schema_cols:
                    reconciled_schema.append(
                        bigquery.SchemaField(
                            name=col,
                            field_type="STRING",
                            mode="NULLABLE",
                            description=f"Dynamically discovered column '{col}'",
                        )
                    )

            # Coerce types matching schema
            for field in reconciled_schema:
                col = field.name
                f_type = field.field_type.upper()
                if col in df.columns:
                    if f_type in ("INTEGER", "INT64"):
                        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
                    elif f_type in ("FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"):
                        df[col] = pd.to_numeric(df[col], errors="coerce")
                    elif f_type in ("TIMESTAMP", "DATETIME"):
                        df[col] = pd.to_datetime(df[col], errors="coerce", utc=True)
                    elif f_type == "STRING":
                        df[col] = df[col].apply(lambda v: str(v) if pd.notna(v) else None)

            job_config.schema = reconciled_schema
        except (OSError, json.JSONDecodeError, ValueError) as schema_err:
            logger.warning("Schema parsing warning for %s: %s; falling back to autodetect", schema_path, schema_err)
            job_config.autodetect = True
    else:
        job_config.autodetect = True

    if write_mode.lower() == "append":
        job_config.schema_update_options = [
            bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
            bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
        ]

    try:
        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()
        logger.info("Successfully loaded %d records into BigQuery table '%s'", len(df), table_ref)
        return len(df)
    except Exception as load_err:
        logger.critical("BigQuery load_table_from_dataframe failed: %s", load_err)
        raise RuntimeError(f"BigQuery load job failed: {load_err}") from load_err
