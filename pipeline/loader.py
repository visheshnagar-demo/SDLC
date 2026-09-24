import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from pipeline.logger import get_logger

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
except ImportError:
    bigquery = None

logger = get_logger("loader")


def get_bigquery_schema(schema_file_path: Optional[str] = None) -> Optional[List[Any]]:
    """Loads BigQuery schema definition from JSON schema file if available."""
    if not schema_file_path:
        default_path = Path(__file__).resolve().parent.parent / "schemas" / "postgres_test3_schema.json"
        if default_path.exists():
            schema_file_path = str(default_path)

    if not schema_file_path or not os.path.exists(schema_file_path):
        return None

    try:
        with open(schema_file_path, "r", encoding="utf-8") as f:
            schema_json = json.load(f)
        if bigquery is not None:
            schema_fields = []
            for item in schema_json:
                field = bigquery.SchemaField(
                    name=item["name"],
                    field_type=item["type"],
                    mode=item.get("mode", "NULLABLE"),
                    description=item.get("description"),
                )
                schema_fields.append(field)
            return schema_fields
        return schema_json
    except Exception as exc:
        logger.error(f"Failed to load explicit schema from '{schema_file_path}': {exc}")
        raise RuntimeError(f"Failed to load explicit schema from '{schema_file_path}': {exc}") from exc


def load_dataframe_to_bigquery(
    df: Any,
    project_id: Optional[str] = None,
    dataset_id: Optional[str] = None,
    table_id: Optional[str] = None,
    write_disposition: str = "WRITE_TRUNCATE",
    client: Any = None,
) -> int:
    """Loads a cleaned DataFrame or records list into BigQuery dataset and table.

    Raises RuntimeError on job failure.
    """
    if df is None:
        raise ValueError("DataFrame to load cannot be None.")

    project_id = project_id or os.getenv("GCP_PROJECT", "upbeat-repeater-477110-q6")
    dataset_id = dataset_id or os.getenv("BQ_DATASET", "analytics")
    table_id = table_id or os.getenv("BQ_TABLE", "postgres_test3")

    if not project_id or not dataset_id or not table_id:
        raise EnvironmentError(
            f"BigQuery destination details missing: project='{project_id}', dataset='{dataset_id}', table='{table_id}'."
        )

    full_table_id = f"{project_id}.{dataset_id}.{table_id}"
    record_count = len(df) if hasattr(df, "__len__") else 0
    logger.info(f"Preparing to load {record_count} records into BigQuery table '{full_table_id}'...")

    if client is None:
        if bigquery is None:
            raise RuntimeError("google-cloud-bigquery must be installed to load data to BigQuery.")
        client = bigquery.Client(project=project_id)

    # Configure load job
    job_config = None
    if bigquery is not None:
        job_config = bigquery.LoadJobConfig(
            write_disposition=getattr(bigquery.WriteDisposition, write_disposition, "WRITE_TRUNCATE"),
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
        )
        explicit_schema = get_bigquery_schema()
        if explicit_schema and isinstance(explicit_schema[0], bigquery.SchemaField):
            job_config.schema = explicit_schema
        else:
            job_config.autodetect = True

    try:
        if pd is not None and isinstance(df, pd.DataFrame):
            load_job = client.load_table_from_dataframe(
                df,
                full_table_id,
                job_config=job_config,
            )
        elif hasattr(client, "load_table_from_dataframe"):
            load_job = client.load_table_from_dataframe(
                df,
                full_table_id,
                job_config=job_config,
            )
        else:
            load_job = client.load_table_from_json(
                df if isinstance(df, list) else [df],
                full_table_id,
                job_config=job_config,
            )
        result = load_job.result()  # Wait for the job to complete
        output_rows = getattr(result, "output_rows", None) or record_count
        logger.info(f"Successfully loaded {output_rows} rows into '{full_table_id}'.")
        return output_rows
    except Exception as exc:
        logger.error(f"BigQuery load job failed for '{full_table_id}': {exc}")
        if hasattr(exc, "errors") and exc.errors:
            logger.error(f"BigQuery load errors: {exc.errors}")
        raise RuntimeError(f"BigQuery load job failed for '{full_table_id}': {exc}") from exc
