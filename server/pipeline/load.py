"""BigQuery Loader Module for ETL Pipeline."""

from typing import Any, Optional
from server.pipeline.observability import structured_logger

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
    HAS_BIGQUERY = True
except ImportError:
    HAS_BIGQUERY = False
    bigquery = None
    NotFound = Exception


def get_bigquery_schema() -> Any:
    """Return BigQuery SchemaField list if library installed, else list of dicts."""
    if HAS_BIGQUERY and bigquery is not None:
        return [
            bigquery.SchemaField("rank", "INTEGER", mode="NULLABLE", description="Rank of the concert tour"),
            bigquery.SchemaField("peak", "STRING", mode="NULLABLE", description="Peak position"),
            bigquery.SchemaField("all_time_peak", "STRING", mode="NULLABLE", description="All time peak position"),
            bigquery.SchemaField("actual_gross", "STRING", mode="NULLABLE", description="Actual gross revenue"),
            bigquery.SchemaField("adjusted_gross_in_2022_dollars", "STRING", mode="NULLABLE", description="Adjusted gross revenue in 2022 dollars"),
            bigquery.SchemaField("artist", "STRING", mode="NULLABLE", description="Name of the artist/performer"),
            bigquery.SchemaField("tour_title", "STRING", mode="NULLABLE", description="Title of the tour"),
            bigquery.SchemaField("years", "STRING", mode="NULLABLE", description="Active year or range of years"),
            bigquery.SchemaField("shows", "INTEGER", mode="NULLABLE", description="Total number of shows"),
            bigquery.SchemaField("average_gross", "STRING", mode="NULLABLE", description="Average gross revenue per show"),
            bigquery.SchemaField("ref", "STRING", mode="NULLABLE", description="Reference citation"),
            bigquery.SchemaField("_etl_loaded_at", "TIMESTAMP", mode="NULLABLE", description="Timestamp when the record was ingested"),
        ]
    return [
        {"name": "rank", "type": "INTEGER", "mode": "NULLABLE"},
        {"name": "peak", "type": "STRING", "mode": "NULLABLE"},
        {"name": "all_time_peak", "type": "STRING", "mode": "NULLABLE"},
        {"name": "actual_gross", "type": "STRING", "mode": "NULLABLE"},
        {"name": "adjusted_gross_in_2022_dollars", "type": "STRING", "mode": "NULLABLE"},
        {"name": "artist", "type": "STRING", "mode": "NULLABLE"},
        {"name": "tour_title", "type": "STRING", "mode": "NULLABLE"},
        {"name": "years", "type": "STRING", "mode": "NULLABLE"},
        {"name": "shows", "type": "INTEGER", "mode": "NULLABLE"},
        {"name": "average_gross", "type": "STRING", "mode": "NULLABLE"},
        {"name": "ref", "type": "STRING", "mode": "NULLABLE"},
        {"name": "_etl_loaded_at", "type": "TIMESTAMP", "mode": "NULLABLE"},
    ]


def _ensure_dataset_exists(
    client: Any,
    project_id: str,
    dataset_id: str,
    location: str = "US",
) -> Any:
    """Ensure destination BigQuery dataset exists, creating it if absent."""
    if hasattr(client, "dataset"):
        dataset_ref = client.dataset(dataset_id, project=project_id)
    elif HAS_BIGQUERY and bigquery is not None:
        dataset_ref = bigquery.DatasetReference(project_id, dataset_id)
    else:
        dataset_ref = f"{project_id}.{dataset_id}"

    try:
        dataset = client.get_dataset(dataset_ref)
        structured_logger.info(f"BigQuery dataset '{project_id}.{dataset_id}' exists.")
        return dataset
    except Exception as exc:
        if isinstance(exc, NotFound) or "not found" in str(exc).lower():
            structured_logger.info(f"Dataset '{project_id}.{dataset_id}' not found. Creating in location '{location}'...")
            if HAS_BIGQUERY and bigquery is not None:
                new_ds = bigquery.Dataset(dataset_ref)
                new_ds.location = location
                dataset = client.create_dataset(new_ds, timeout=30)
            else:
                dataset = client.create_dataset(dataset_ref)
            structured_logger.info(f"Created dataset '{project_id}.{dataset_id}'.")
            return dataset
        raise


def load_to_bigquery(
    df: Any,
    project_id: str,
    dataset_id: str,
    table_id: str,
    write_disposition: str = "WRITE_TRUNCATE",
    location: str = "US",
    bq_client: Optional[Any] = None,
) -> dict[str, Any]:
    """
    Loads transformed DataFrame or records into Google BigQuery.

    Args:
        df: Cleaned pd.DataFrame or list of row dicts.
        project_id: GCP Project ID (e.g. 'upbeat-repeater-477110-q6').
        dataset_id: BigQuery Dataset ID (e.g. 'analytics').
        table_id: BigQuery Table ID (e.g. 'viswa').
        write_disposition: BigQuery Write disposition (WRITE_TRUNCATE or WRITE_APPEND).
        location: GCP Dataset location.
        bq_client: Optional pre-configured BigQuery Client.

    Returns:
        Dictionary with load execution metrics.

    Raises:
        RuntimeError: If load job fails or destination validation fails.
    """
    full_table_ref = f"{project_id}.{dataset_id}.{table_id}"
    num_records = len(df) if df is not None else 0

    structured_logger.info(
        "Starting BigQuery load job",
        {
            "target_table": full_table_ref,
            "rows_to_load": num_records,
            "write_disposition": write_disposition,
        },
    )

    if df is None or num_records == 0:
        raise RuntimeError("Cannot load empty DataFrame or recordset to BigQuery.")

    if bq_client is not None:
        client = bq_client
    elif HAS_BIGQUERY and bigquery is not None:
        client = bigquery.Client(project=project_id)
    else:
        raise RuntimeError("google-cloud-bigquery library is not installed and no client provided.")

    # 1. Ensure dataset exists
    _ensure_dataset_exists(client, project_id, dataset_id, location=location)

    # 2. Configure Job
    schema = get_bigquery_schema()
    job_config = None
    if HAS_BIGQUERY and bigquery is not None:
        job_config = bigquery.LoadJobConfig(
            schema=schema,
            write_disposition=getattr(
                bigquery.WriteDisposition,
                write_disposition,
                bigquery.WriteDisposition.WRITE_TRUNCATE,
            ),
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="_etl_loaded_at",
            ),
            clustering_fields=["artist"],
        )

    try:
        if HAS_PANDAS and pd is not None and isinstance(df, pd.DataFrame) and hasattr(client, "load_table_from_dataframe"):
            job = client.load_table_from_dataframe(
                df,
                full_table_ref,
                job_config=job_config,
            )
        elif hasattr(client, "load_table_from_json"):
            json_rows = df if isinstance(df, list) else df.to_dict(orient="records")
            job = client.load_table_from_json(
                json_rows,
                full_table_ref,
                job_config=job_config,
            )
        else:
            # For mocked or generic client
            job = client.load_table_from_dataframe(df, full_table_ref, job_config=job_config)

        if hasattr(job, "result"):
            job.result()

        job_id = getattr(job, "job_id", "mock-job-id")
        table = client.get_table(full_table_ref) if hasattr(client, "get_table") else None
        destination_rows = getattr(table, "num_rows", num_records)

        structured_logger.info(
            "BigQuery load job finished successfully",
            {
                "target_table": full_table_ref,
                "rows_in_table": destination_rows,
                "job_id": job_id,
            },
        )

        return {
            "status": "SUCCESS",
            "job_id": job_id,
            "target_table": full_table_ref,
            "rows_loaded": num_records,
            "destination_total_rows": destination_rows,
        }

    except Exception as exc:
        error_msg = f"BigQuery load job failed for table '{full_table_ref}': {str(exc)}"
        structured_logger.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from exc
