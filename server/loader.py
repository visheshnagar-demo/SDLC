"""BigQuery Target Loader module."""
import json
import logging
import os
import time
from typing import List, Optional, Tuple
from server.compat import pd, bigquery, NotFound
from server.config import PipelineConfig
from server.models import LoadSummary

logger = logging.getLogger(__name__)

SCHEMA_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "schemas",
    "kttest04_schema.json"
)


class BigQueryTargetLoader:
    """Loads transformed DataFrames into target BigQuery tables."""

    def __init__(self, config: PipelineConfig, bq_client: Optional[bigquery.Client] = None):
        self.config = config
        self._client = bq_client

    @property
    def client(self) -> bigquery.Client:
        if self._client is None:
            self._client = bigquery.Client(project=self.config.project_id)
        return self._client

    def _get_schema_fields(self) -> List[bigquery.SchemaField]:
        """Loads schema fields from schemas/kttest04_schema.json or falls back to defaults."""
        if os.path.exists(SCHEMA_FILE_PATH):
            with open(SCHEMA_FILE_PATH, "r", encoding="utf-8") as f:
                schema_json = json.load(f)
            return [
                bigquery.SchemaField(
                    name=field["name"],
                    field_type=field["type"],
                    mode=field.get("mode", "NULLABLE"),
                    description=field.get("description")
                )
                for field in schema_json
            ]

        # Default fallback schema
        return [
            bigquery.SchemaField("rank", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("peak", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("all_time_peak", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("actual_gross", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("adjusted_gross_2022_dollars", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("artist", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("tour_title", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("years", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("shows", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("average_gross", "INTEGER", mode="NULLABLE"),
            bigquery.SchemaField("ref", "STRING", mode="NULLABLE"),
            bigquery.SchemaField("_ingested_at", "TIMESTAMP", mode="NULLABLE"),
        ]

    def _ensure_dataset_exists(self) -> None:
        """Ensures the destination BigQuery dataset exists."""
        dataset_ref = bigquery.DatasetReference(self.config.project_id, self.config.dataset_id)
        try:
            self.client.get_dataset(dataset_ref)
            logger.info("Dataset %s already exists.", self.config.dataset_id)
        except NotFound:
            logger.info("Creating dataset %s in project %s", self.config.dataset_id, self.config.project_id)
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            self.client.create_dataset(dataset, exists_ok=True)

    def _reconcile_schema(self, df: pd.DataFrame, schema_fields: List[bigquery.SchemaField]) -> Tuple[pd.DataFrame, List[bigquery.SchemaField]]:
        """Reconciles DataFrame columns against BigQuery schema fields."""
        df_reconciled = df.copy()
        schema_dict = {field.name: field for field in schema_fields}

        # Pad missing schema fields with None in DataFrame
        for field in schema_fields:
            if field.name not in df_reconciled.columns:
                df_reconciled[field.name] = None

        # Add any unmodeled DataFrame columns to schema as STRING
        reconciled_fields = list(schema_fields)
        for col in df_reconciled.columns:
            if col not in schema_dict:
                logger.info("Adding dynamic unmodeled column %s as STRING to schema", col)
                new_field = bigquery.SchemaField(col, "STRING", mode="NULLABLE")
                reconciled_fields.append(new_field)

        return df_reconciled, reconciled_fields

    def load(self, df: pd.DataFrame) -> LoadSummary:
        """Loads DataFrame into target BigQuery table with retry policy."""
        table_ref = f"{self.config.project_id}.{self.config.dataset_id}.{self.config.table_id}"
        logger.info("Preparing to load %d rows into BigQuery table: %s", len(df), table_ref)

        self._ensure_dataset_exists()
        schema_fields = self._get_schema_fields()
        df_to_load, final_schema = self._reconcile_schema(df, schema_fields)

        write_disp = getattr(
            bigquery.WriteDisposition,
            self.config.write_disposition.upper(),
            bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(
            schema=final_schema,
            write_disposition=write_disp
        )

        for attempt in range(1, self.config.max_retries + 1):
            try:
                load_job = self.client.load_table_from_dataframe(
                    df_to_load,
                    table_ref,
                    job_config=job_config
                )
                load_job.result()  # Wait for job to complete

                table = self.client.get_table(table_ref)
                logger.info(
                    "BigQuery load job %s succeeded. Destination table has %d rows.",
                    load_job.job_id,
                    getattr(table, "num_rows", 0)
                )

                return LoadSummary(
                    target_table=table_ref,
                    rows_loaded=len(df_to_load),
                    job_id=str(load_job.job_id),
                    write_disposition=self.config.write_disposition
                )

            except Exception as exc:
                logger.warning(
                    "Load attempt %d/%d failed: %s",
                    attempt,
                    self.config.max_retries,
                    str(exc)
                )
                if attempt == self.config.max_retries:
                    raise RuntimeError(
                        f"Failed to load data into BigQuery table {table_ref} after {self.config.max_retries} attempts: {exc}"
                    ) from exc
                sleep_time = self.config.retry_delay_seconds * (2 ** (attempt - 1))
                time.sleep(sleep_time)

        raise RuntimeError(f"Failed to load data into BigQuery table {table_ref} after {self.config.max_retries} attempts.")
