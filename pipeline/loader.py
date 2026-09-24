"""BigQuery Loader module with schema reconciliation and type-safe batch loading."""
import json
import logging
import os
import sys
import pandas as pd
from google.api_core.exceptions import NotFound
from config import PipelineConfig

logger = logging.getLogger("etl_pipeline.loader")


def load_to_bigquery(df: pd.DataFrame, cfg: PipelineConfig) -> int:
    """Loads transformed DataFrame into BigQuery target table with automatic schema reconciliation."""
    if df is None or df.empty:
        logger.warning("Empty DataFrame provided to loader. Skipping load.")
        return 0

    from google.cloud import bigquery

    project_id = cfg.gcp_project_id
    dataset_id = cfg.bigquery_dataset
    table_id = cfg.bigquery_table
    table_ref = f"{project_id}.{dataset_id}.{table_id}" if project_id else f"{dataset_id}.{table_id}"

    logger.info("Initializing BigQuery client for project '%s'...", project_id)
    try:
        client = bigquery.Client(project=project_id) if project_id else bigquery.Client()
    except Exception as exc:
        logger.error("Failed to initialize BigQuery client: %s", exc)
        raise EnvironmentError(f"BigQuery client initialization failed: {exc}") from exc

    # 1. Ensure target dataset exists
    try:
        dataset_ref = client.dataset(dataset_id, project=project_id)
        try:
            client.get_dataset(dataset_ref)
        except NotFound:
            ds = bigquery.Dataset(dataset_ref)
            ds.location = cfg.bq_location
            client.create_dataset(ds, exists_ok=True)
            logger.info("Created BigQuery dataset '%s'.", dataset_id)
    except Exception as exc:
        logger.error("Dataset verification failed for '%s': %s", dataset_id, exc)
        raise RuntimeError(f"Failed ensuring BigQuery dataset exists: {exc}") from exc

    # 2. Build LoadJobConfig with schema reconciliation
    write_disp = (
        bigquery.WriteDisposition.WRITE_APPEND
        if cfg.write_disposition.upper() == "WRITE_APPEND"
        else bigquery.WriteDisposition.WRITE_TRUNCATE
    )
    job_config = bigquery.LoadJobConfig(
        write_disposition=write_disp,
        create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
    )

    schema_file = cfg.schema_path if os.path.isfile(cfg.schema_path) else None
    if not schema_file:
        for alt in [
            "schemas/postgres_test2_schema.json",
            "schemas/target_table_schema.json",
        ]:
            if os.path.isfile(alt):
                schema_file = alt
                break

    if schema_file:
        try:
            with open(schema_file, "r", encoding="utf-8") as f:
                schema_json = json.load(f)
            
            raw_schema = [
                bigquery.SchemaField(
                    name=item["name"],
                    field_type=item["type"],
                    mode=item.get("mode", "NULLABLE"),
                    description=item.get("description", ""),
                )
                for item in schema_json
                if item.get("name")
            ]

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
                            description=f"Dynamically discovered column '{col}'",
                        )
                    )

            # Type safe coercion
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
                    elif f_type in ("BOOLEAN", "BOOL"):
                        df[col] = df[col].map(
                            lambda v: True if str(v).strip().lower() in ("true", "1", "t", "yes")
                            else (False if str(v).strip().lower() in ("false", "0", "f", "no") else None)
                            if pd.notna(v) else None
                        ).astype("boolean")
                    elif f_type == "STRING":
                        df[col] = df[col].apply(lambda v: str(v) if pd.notna(v) and str(v) != "None" else None)

            job_config.schema = reconciled_schema
            logger.info("Attached reconciled schema with %d fields.", len(reconciled_schema))
        except Exception as schema_err:
            logger.error("Failed to parse schema file '%s': %s", schema_file, schema_err)
            raise RuntimeError(f"Schema loading error: {schema_err}") from schema_err
    else:
        job_config.autodetect = True

    if write_disp == bigquery.WriteDisposition.WRITE_APPEND:
        job_config.schema_update_options = [
            bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
            bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
        ]

    # Partition by _etl_loaded_at if present
    if "_etl_loaded_at" in df.columns:
        job_config.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="_etl_loaded_at",
        )

    logger.info("Loading %d records into BigQuery table '%s'...", len(df), table_ref)
    try:
        job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        job.result()  # Wait for completion
        logger.info("Successfully loaded %d records into BigQuery '%s'.", len(df), table_ref)
        return len(df)
    except Exception as exc:
        logger.error("BigQuery load_table_from_dataframe failed: %s", exc)
        raise RuntimeError(f"BigQuery load failed: {exc}") from exc
