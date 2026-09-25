"""Loader module for Google BigQuery."""
import logging
import os
import pandas as pd
from google.cloud import bigquery
from server.etl.config import ETLConfig

logger = logging.getLogger("server.etl.loader")


class BigQueryLoader:
    """Loads cleaned DataFrames into Google BigQuery with schema reconciliation."""

    def __init__(self, config: ETLConfig):
        self.config = config
        self._init_client()

    def _init_client(self):
        project_id = self.config.gcp_project_id
        try:
            self.client = bigquery.Client(project=project_id) if project_id else bigquery.Client()
        except Exception as exc:
            raise EnvironmentError(
                f"FATAL: Unable to initialize BigQuery client for project '{project_id}': {exc}"
            ) from exc

    def _ensure_dataset(self):
        dataset_ref = self.client.dataset(self.config.bq_dataset, project=self.config.gcp_project_id)
        ds = bigquery.Dataset(dataset_ref)
        ds.location = self.config.bq_location
        self.client.create_dataset(ds, exists_ok=True)
        logger.info("Ensured target BigQuery dataset exists: %s", dataset_ref)

    def load(self, df: pd.DataFrame) -> int:
        """Loads DataFrame into BigQuery target table with explicit schema reconciliation."""
        if df is None or df.empty:
            logger.warning("Empty DataFrame provided. Skipping BigQuery load.")
            return 0

        self._ensure_dataset()
        table_ref = f"{self.config.gcp_project_id}.{self.config.bq_dataset}.{self.config.bq_table}"

        write_disp = (
            bigquery.WriteDisposition.WRITE_APPEND
            if self.config.write_disposition == "WRITE_APPEND"
            else bigquery.WriteDisposition.WRITE_TRUNCATE
        )

        job_config = bigquery.LoadJobConfig(
            write_disposition=write_disp,
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
        )

        # Schema discovery and reconciliation
        schema_file = None
        for candidate in [
            os.path.join("schemas", f"{self.config.bq_table}_schema.json"),
            os.path.join("schemas", "postgres_test4_schema.json"),
            os.path.join("schemas", "target_table_schema.json"),
        ]:
            if os.path.isfile(candidate):
                schema_file = candidate
                break

        df_load = df.copy()

        if schema_file:
            raw_schema = self.client.schema_from_json(schema_file)
            reconciled_schema = []
            schema_col_names = set()

            for field in raw_schema:
                schema_col_names.add(field.name)
                if field.name not in df_load.columns:
                    df_load[field.name] = None
                    reconciled_schema.append(
                        bigquery.SchemaField(
                            name=field.name,
                            field_type=field.field_type,
                            mode="NULLABLE",
                            description=field.description,
                        )
                    )
                    logger.info("Padded missing schema column '%s' with NULLs.", field.name)
                else:
                    reconciled_schema.append(field)

            for col in df_load.columns:
                if col not in schema_col_names:
                    reconciled_schema.append(
                        bigquery.SchemaField(
                            name=col,
                            field_type="STRING",
                            mode="NULLABLE",
                            description=f"Dynamically discovered column '{col}'",
                        )
                    )
                    logger.info("Appended dynamic column '%s' to BigQuery schema.", col)

            # Type-safe coercion
            for field in reconciled_schema:
                col = field.name
                f_type = field.field_type.upper()
                if col in df_load.columns:
                    if f_type in ("INTEGER", "INT64"):
                        df_load[col] = pd.to_numeric(df_load[col], errors="coerce").astype("Int64")
                    elif f_type in ("FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"):
                        df_load[col] = pd.to_numeric(df_load[col], errors="coerce")
                    elif f_type in ("TIMESTAMP", "DATETIME"):
                        df_load[col] = pd.to_datetime(df_load[col], errors="coerce", utc=True)
                    elif f_type in ("BOOLEAN", "BOOL"):
                        df_load[col] = df_load[col].map(
                            lambda v: True if str(v).strip().lower() in ("true", "1", "t", "yes")
                            else (False if str(v).strip().lower() in ("false", "0", "f", "no") else None)
                            if pd.notna(v) else None
                        ).astype("boolean")
                    elif f_type == "STRING":
                        df_load[col] = df_load[col].apply(lambda v: str(v) if pd.notna(v) else None)

            job_config.schema = reconciled_schema
            logger.info("Configured schema with %d fields from %s.", len(reconciled_schema), schema_file)
        else:
            job_config.autodetect = True

        if write_disp == bigquery.WriteDisposition.WRITE_APPEND:
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        try:
            job = self.client.load_table_from_dataframe(df_load, table_ref, job_config=job_config)
            job.result()  # Wait for completion
        except Exception as load_err:
            logger.error("BigQuery load_table_from_dataframe failed: %s", load_err)
            raise RuntimeError(f"BigQuery load failed for table '{table_ref}': {load_err}") from load_err

        logger.info("Successfully loaded %d records into BigQuery table '%s'.", len(df_load), table_ref)
        return len(df_load)
