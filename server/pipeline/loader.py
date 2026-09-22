"""BigQuery data loader engine."""
import json
import os
from typing import List, Optional
import pandas as pd
from google.cloud import bigquery
from server.config import ETLConfig
from server.utils.logger import get_logger
from server.utils.exceptions import LoadError, ConfigurationError

logger = get_logger("sdlc-etl-loader")


def load_schema_from_file(schema_path: str) -> List[bigquery.SchemaField]:
    """Parses a BigQuery JSON schema file into a sequence of bigquery.SchemaField objects."""
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_data = json.load(f)

    schema_fields: List[bigquery.SchemaField] = []
    if isinstance(schema_data, list):
        for field in schema_data:
            if isinstance(field, dict):
                schema_fields.append(
                    bigquery.SchemaField(
                        name=field["name"],
                        field_type=field.get("type", field.get("field_type", "STRING")),
                        mode=field.get("mode", "NULLABLE"),
                        description=field.get("description"),
                    )
                )
    return schema_fields


class BigQueryLoader:
    """Loads cleaned DataFrames into Google Cloud BigQuery."""

    def __init__(self, config: ETLConfig, client: Optional[bigquery.Client] = None):
        self.config = config
        self._client = client

    @property
    def client(self) -> bigquery.Client:
        """Initializes or returns BigQuery client."""
        if self._client is None:
            if not self.config.bq_project_id:
                raise ConfigurationError("GCP Project ID must be configured for BigQuery loading.")
            try:
                self._client = bigquery.Client(project=self.config.bq_project_id)
            except Exception as exc:
                raise LoadError(f"Failed to initialize BigQuery client: {exc}") from exc
        return self._client

    def _get_schema_file_path(self) -> Optional[str]:
        """Locates the schema JSON file for the target table."""
        candidates = [
            os.path.join("schemas", f"{self.config.bq_table}_schema.json"),
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "schemas",
                f"{self.config.bq_table}_schema.json",
            ),
        ]
        for candidate in candidates:
            if os.path.isfile(candidate):
                return candidate
        return None

    def load(self, df: pd.DataFrame) -> int:
        """Loads DataFrame into BigQuery target table."""
        if df is None or len(df) == 0:
            logger.warning("Empty DataFrame provided to BigQueryLoader. Skipping load operation.")
            return 0

        table_ref = f"{self.config.bq_project_id}.{self.config.bq_dataset}.{self.config.bq_table}"
        logger.info(
            "Submitting BigQuery load job for %d rows into %s (disposition: %s)",
            len(df),
            table_ref,
            self.config.write_disposition,
        )

        disposition = (
            bigquery.WriteDisposition.WRITE_APPEND
            if self.config.write_disposition.upper() in ["APPEND", "WRITE_APPEND"]
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(write_disposition=disposition)

        schema_file = self._get_schema_file_path()
        if schema_file:
            try:
                schema_fields = load_schema_from_file(schema_file)
                if schema_fields:
                    job_config.schema = schema_fields
                    logger.info("Loaded %d schema fields from %s", len(schema_fields), schema_file)
            except Exception as exc:
                raise LoadError(f"Could not apply schema file {schema_file}: {exc}") from exc

        try:
            load_job = self.client.load_table_from_dataframe(
                df, table_ref, job_config=job_config
            )
            load_job.result()

            if load_job.errors:
                raise LoadError(f"BigQuery load job encountered errors: {load_job.errors}")

            logger.info(
                "Successfully loaded %d records into BigQuery table %s",
                len(df),
                table_ref,
            )
            return len(df)

        except LoadError:
            raise
        except Exception as exc:
            raise LoadError(f"Failed to load records into BigQuery table {table_ref}: {exc}") from exc
