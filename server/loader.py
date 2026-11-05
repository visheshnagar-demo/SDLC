import logging
from typing import Optional
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

logger = logging.getLogger(__name__)


def get_bigquery_schema() -> list[bigquery.SchemaField]:
    """Return the BigQuery schema definition for analytics.new_sales_orders."""
    return [
        bigquery.SchemaField(
            "order_id", "STRING", mode="REQUIRED", description="Unique order identifier"
        ),
        bigquery.SchemaField(
            "customer_id", "STRING", mode="REQUIRED", description="Customer identifier"
        ),
        bigquery.SchemaField(
            "product_id", "STRING", mode="REQUIRED", description="Product identifier"
        ),
        bigquery.SchemaField(
            "product_category",
            "STRING",
            mode="NULLABLE",
            description="Product category",
        ),
        bigquery.SchemaField(
            "quantity", "INTEGER", mode="REQUIRED", description="Quantity ordered"
        ),
        bigquery.SchemaField(
            "unit_price", "FLOAT", mode="REQUIRED", description="Unit price"
        ),
        bigquery.SchemaField(
            "total_amount", "FLOAT", mode="REQUIRED", description="Total order amount"
        ),
        bigquery.SchemaField(
            "order_status", "STRING", mode="REQUIRED", description="Order status"
        ),
        bigquery.SchemaField(
            "created_at", "TIMESTAMP", mode="REQUIRED", description="Order timestamp"
        ),
        bigquery.SchemaField(
            "ingested_at",
            "TIMESTAMP",
            mode="REQUIRED",
            description="Ingestion timestamp",
        ),
        bigquery.SchemaField(
            "batch_id", "STRING", mode="REQUIRED", description="Batch run UUID"
        ),
    ]


def ensure_dataset_and_table(
    client: bigquery.Client,
    project_id: str,
    dataset_id: str,
    table_id: str,
    partition_field: str = "created_at",
) -> bigquery.Table:
    """Ensure dataset and partitioned table exist in BigQuery."""
    dataset_ref = bigquery.DatasetReference(project_id, dataset_id)
    try:
        client.get_dataset(dataset_ref)
        logger.info("Dataset %s already exists.", dataset_id)
    except NotFound:
        logger.info("Dataset %s not found. Creating dataset...", dataset_id)
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "US"
        client.create_dataset(dataset, exists_ok=True)
        logger.info("Dataset %s created successfully.", dataset_id)

    table_ref = dataset_ref.table(table_id)
    schema = get_bigquery_schema()
    try:
        table = client.get_table(table_ref)
        logger.info("Table %s.%s already exists.", dataset_id, table_id)
        return table
    except NotFound:
        logger.info(
            "Table %s.%s not found. Creating partitioned table...", dataset_id, table_id
        )
        table = bigquery.Table(table_ref, schema=schema)
        table.time_partitioning = bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field=partition_field,
        )
        created_table = client.create_table(table)
        logger.info(
            "Partitioned table %s.%s created successfully.", dataset_id, table_id
        )
        return created_table


def load_to_bigquery(
    df: pd.DataFrame,
    project_id: str,
    dataset_id: str,
    table_id: str,
    partition_field: str = "created_at",
    client: Optional[bigquery.Client] = None,
) -> int:
    """
    Load cleaned sales order records into partitioned BigQuery table.

    Returns:
        Number of rows loaded.
    """
    if df is None or df.empty:
        logger.info("No records to load into BigQuery.")
        return 0

    bq_client = client or bigquery.Client(project=project_id)
    ensure_dataset_and_table(
        client=bq_client,
        project_id=project_id,
        dataset_id=dataset_id,
        table_id=table_id,
        partition_field=partition_field,
    )

    table_ref = f"{project_id}.{dataset_id}.{table_id}"
    job_config = bigquery.LoadJobConfig(
        schema=get_bigquery_schema(),
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        time_partitioning=bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field=partition_field,
        ),
    )

    logger.info("Submitting BigQuery load job for %d rows into %s", len(df), table_ref)
    load_job = bq_client.load_table_from_dataframe(df, table_ref, job_config=job_config)
    load_job.result()  # Wait for job to complete
    logger.info("BigQuery load job %s completed successfully.", load_job.job_id)
    return len(df)
