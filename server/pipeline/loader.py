"""BigQuery data loader engine."""
import os
import pandas as pd
from google.cloud import bigquery
from server.config import ETLConfig
from server.utils.logger import get_logger
from server.utils.exceptions import LoadError, ConfigurationError

logger = get_logger("sdlc-etl-loader")


class BigQueryLoader:
    """Loads cleaned DataFrames into Google Cloud BigQuery."""

    def __init__(self, config: ETLConfig, client: bigquery.Client = None):
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

        schema_file = os.path.join("schemas", f"{self.config.bq_table}_schema.json")
        if not os.path.exists(schema_file):
            schema_file = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "schemas",
                f"{self.config.bq_table}_schema.json",
            )

        if os.path.isfile(schema_file):
            try:
                job_config.schema = self.client.schema_from_json(schema_file)
                logger.info("Loaded schema definition from %s", schema_file)
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
