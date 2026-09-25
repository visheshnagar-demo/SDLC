"""BigQuery Loader module for test04 ETL pipeline."""
import os
import sys
import json
import logging

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from google.cloud import bigquery
    from google.api_core.exceptions import GoogleAPICallError, NotFound, Conflict
except ImportError:
    bigquery = None
    GoogleAPICallError = Exception
    NotFound = Exception
    Conflict = Exception

logger = logging.getLogger("test04_etl.loader")


class BigQueryLoader:
    """Loads transformed DataFrame into Google Cloud BigQuery."""

    def __init__(
        self,
        project_id: str = None,
        dataset_id: str = None,
        table_id: str = None,
        write_mode: str = "overwrite",
    ):
        self.project_id = (
            project_id
            or os.getenv("GCP_PROJECT_ID")
            or os.getenv("PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or "upbeat-repeater-477110-q6"
        )
        self.dataset_id = dataset_id or os.getenv("BIGQUERY_DATASET", "analytics")
        self.table_id = table_id or os.getenv("BIGQUERY_TABLE", "test04")
        self.write_mode = write_mode

    def _get_client(self):
        """Initializes and returns BigQuery client."""
        if bigquery is None:
            raise RuntimeError("FATAL: google-cloud-bigquery is required for BigQuery loading.")
        try:
            if self.project_id:
                client = bigquery.Client(project=self.project_id)
            else:
                client = bigquery.Client()
                if hasattr(client, "project") and client.project:
                    self.project_id = client.project
            return client
        except Exception as e:
            logger.critical("Failed to initialize BigQuery client: %s", e)
            raise EnvironmentError(
                f"FATAL: Unable to initialize BigQuery client (project='{self.project_id}'): {e}"
            ) from e

    def _reconcile_schema(self, client, df: "pd.DataFrame"):
        """Loads and reconciles BigQuery schema against DataFrame columns."""
        schema_file_candidates = [
            os.path.join("schemas", "test04_schema.json"),
            os.path.join("schemas", "test04_etl_schema.json"),
        ]
        schema_file = next((f for f in schema_file_candidates if os.path.isfile(f)), None)

        if schema_file and bigquery is not None:
            raw_schema = client.schema_from_json(schema_file)
            reconciled = []
            schema_col_names = set()
            for field in raw_schema:
                schema_col_names.add(field.name)
                if field.name not in df.columns:
                    df[field.name] = None
                    reconciled.append(
                        bigquery.SchemaField(
                            name=field.name,
                            field_type=field.field_type,
                            mode="NULLABLE",
                            description=field.description,
                        )
                    )
                else:
                    reconciled.append(field)

            for col in df.columns:
                if col not in schema_col_names:
                    reconciled.append(
                        bigquery.SchemaField(
                            name=col,
                            field_type="STRING",
                            mode="NULLABLE",
                            description=f"Dynamically discovered column '{col}'",
                        )
                    )
            return reconciled

        return None

    def load(self, df: "pd.DataFrame") -> int:
        """Loads pandas DataFrame into BigQuery table.

        Zero-mock policy: Raises RuntimeError on failed job.
        """
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for DataFrame loading.")
        if bigquery is None:
            raise RuntimeError("FATAL: google-cloud-bigquery is required for BigQuery loading.")
        if df is None or df.empty:
            logger.warning("No records to load into BigQuery.")
            return 0

        client = self._get_client()
        table_ref = f"{self.project_id}.{self.dataset_id}.{self.table_id}" if self.project_id else f"{self.dataset_id}.{self.table_id}"

        # Ensure dataset exists
        dataset_ref = client.dataset(self.dataset_id, project=self.project_id)
        try:
            client.get_dataset(dataset_ref)
        except (NotFound, GoogleAPICallError):
            try:
                ds = bigquery.Dataset(dataset_ref)
                ds.location = os.getenv("BQ_LOCATION", "us-central1")
                client.create_dataset(ds, exists_ok=True)
                logger.info("Ensured target BigQuery dataset '%s' exists.", self.dataset_id)
            except Conflict:
                pass
            except Exception as create_ds_err:
                logger.critical("Failed to create dataset %s: %s", self.dataset_id, create_ds_err)
                raise RuntimeError(f"FATAL: Failed to create dataset {self.dataset_id}: {create_ds_err}") from create_ds_err

        # Prepare BigQuery LoadJobConfig
        disposition = (
            bigquery.WriteDisposition.WRITE_APPEND
            if self.write_mode == "append"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(
            write_disposition=disposition,
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
        )

        reconciled_schema = self._reconcile_schema(client, df)
        if reconciled_schema:
            job_config.schema = reconciled_schema
        else:
            job_config.autodetect = True

        logger.info("Loading %d records into BigQuery table '%s'...", len(df), table_ref)

        try:
            load_job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
            load_job.result()  # Wait for completion
        except Exception as load_err:
            logger.critical("load_table_from_dataframe failed: %s", load_err)
            raise RuntimeError(f"FATAL: BigQuery load job failed: {load_err}") from load_err

        logger.info("Successfully loaded %d records into '%s'.", len(df), table_ref)
        return len(df)
