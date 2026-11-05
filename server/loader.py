"""BigQuery partitioned table loader module."""

import logging
from typing import List, Optional
from google.cloud import bigquery
from google.cloud.exceptions import GoogleCloudError
import pandas as pd
from server.config import settings

logger = logging.getLogger(__name__)


def get_bigquery_schema() -> List[bigquery.SchemaField]:
    """Define the BigQuery schema matching SalesOrderRecord."""
    return [
        bigquery.SchemaField(
            "order_id",
            "STRING",
            mode="REQUIRED",
            description="Unique sales order identifier",
        ),
        bigquery.SchemaField(
            "customer_id",
            "STRING",
            mode="REQUIRED",
            description="Unique customer identifier",
        ),
        bigquery.SchemaField(
            "product_id",
            "STRING",
            mode="REQUIRED",
            description="Product SKU/identifier",
        ),
        bigquery.SchemaField(
            "product_category",
            "STRING",
            mode="NULLABLE",
            description="Product category name",
        ),
        bigquery.SchemaField(
            "quantity", "INT64", mode="REQUIRED", description="Purchased item quantity"
        ),
        bigquery.SchemaField(
            "unit_price", "NUMERIC", mode="REQUIRED", description="Unit price per item"
        ),
        bigquery.SchemaField(
            "total_amount", "NUMERIC", mode="REQUIRED", description="Total order amount"
        ),
        bigquery.SchemaField(
            "order_status",
            "STRING",
            mode="REQUIRED",
            description="Order fulfillment status",
        ),
        bigquery.SchemaField(
            "created_at",
            "TIMESTAMP",
            mode="REQUIRED",
            description="Order placement timestamp",
        ),
        bigquery.SchemaField(
            "ingested_at",
            "TIMESTAMP",
            mode="REQUIRED",
            description="Pipeline ingestion timestamp",
        ),
        bigquery.SchemaField(
            "batch_id", "STRING", mode="REQUIRED", description="ETL batch UUID"
        ),
    ]


class Loader:
    """Handles loading clean sales order records into partitioned BigQuery tables."""

    def __init__(self, bq_client: Optional[bigquery.Client] = None):
        self._bq_client = bq_client

    @property
    def client(self) -> bigquery.Client:
        """Lazily initialize Google BigQuery client."""
        if self._bq_client is None:
            self._bq_client = bigquery.Client(project=settings.GCP_PROJECT)
        return self._bq_client

    def ensure_dataset_exists(self, dataset_id: str) -> None:
        """Create BigQuery dataset if it does not already exist."""
        full_dataset_id = (
            dataset_id if "." in dataset_id else f"{settings.GCP_PROJECT}.{dataset_id}"
        )
        try:
            dataset = bigquery.Dataset(full_dataset_id)
            dataset.location = "US"
            self.client.create_dataset(dataset, exists_ok=True)
            logger.info("Ensured BigQuery dataset exists: %s", full_dataset_id)
        except Exception as e:
            logger.warning(
                "Could not create/verify dataset '%s': %s", full_dataset_id, e
            )

    def load_records(
        self,
        df: pd.DataFrame,
        destination_table_id: Optional[str] = None,
    ) -> int:
        """Load DataFrame into partitioned BigQuery table.

        Args:
            df: Cleaned Pandas DataFrame to load.
            destination_table_id: Target BigQuery table ID. Defaults to settings.bq_table_id.

        Returns:
            Count of loaded rows.
        """
        table_id = destination_table_id or settings.bq_table_id
        if df is None or df.empty:
            logger.info("No records to load into BigQuery table '%s'.", table_id)
            return 0

        logger.info(
            "Loading %d clean records into BigQuery table: %s", len(df), table_id
        )

        # Ensure dataset exists before loading
        dataset_name = (
            table_id.split(".")[-2] if "." in table_id else settings.BQ_DATASET
        )
        self.ensure_dataset_exists(dataset_name)

        job_config = bigquery.LoadJobConfig(
            schema=get_bigquery_schema(),
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="created_at",
            ),
            clustering_fields=["customer_id", "product_id"],
        )

        try:
            # Load DataFrame to BigQuery
            load_job = self.client.load_table_from_dataframe(
                df,
                table_id,
                job_config=job_config,
            )
            # Wait for job to complete
            load_job.result()

            logger.info(
                "Successfully loaded %d records into BigQuery table %s (Job ID: %s)",
                len(df),
                table_id,
                load_job.job_id,
            )
            return len(df)

        except GoogleCloudError as e:
            logger.error(
                "BigQuery load job failed for table '%s': %s",
                table_id,
                e,
                exc_info=True,
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error loading data to BigQuery '%s': %s",
                table_id,
                e,
                exc_info=True,
            )
            raise
