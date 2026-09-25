"""Loader module for Google BigQuery ingestion."""
import json
import logging
import os
from typing import List, Optional
import pandas as pd
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

from src.config import PipelineConfig

logger = logging.getLogger("etl_pipeline.loader")


class BigQueryLoader:
    """Provisions datasets/tables and loads DataFrames into Google BigQuery."""

    def __init__(self, config: PipelineConfig):
        self.config = config
        self._client: Optional[bigquery.Client] = None

    @property
    def client(self) -> bigquery.Client:
        if self._client is None:
            self._client = bigquery.Client(project=self.config.gcp_project)
        return self._client

    def ensure_dataset(self) -> None:
        """Verifies destination dataset exists, creating it if needed."""
        dataset_ref = bigquery.DatasetReference(self.config.gcp_project, self.config.bq_dataset)
        try:
            self.client.get_dataset(dataset_ref)
            logger.info("Destination dataset '%s' already exists.", self.config.bq_dataset)
        except NotFound:
            ds = bigquery.Dataset(dataset_ref)
            ds.location = "us-central1"
            self.client.create_dataset(ds, exists_ok=True)
            logger.info("Successfully created destination dataset '%s'.", self.config.bq_dataset)
        except Exception as exc:
            logger.error("Failed checking or creating dataset '%s': %s", self.config.bq_dataset, exc)
            raise RuntimeError(f"BigQuery dataset error: {exc}") from exc

    def load(self, df: pd.DataFrame, write_disposition: str = "WRITE_APPEND") -> int:
        """Loads sanitized DataFrame into the BigQuery destination table."""
        if df.empty:
            logger.warning("Empty DataFrame passed to loader. Skipping ingestion.")
            return 0

        self.ensure_dataset()
        table_ref = f"{self.config.gcp_project}.{self.config.bq_dataset}.{self.config.bq_table}"
        logger.info("Initiating load of %d records to BigQuery table: %s", len(df), table_ref)

        job_config = bigquery.LoadJobConfig(
            write_disposition=getattr(bigquery.WriteDisposition, write_disposition, bigquery.WriteDisposition.WRITE_APPEND),
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
        )

        schema_file = os.path.join("schemas", f"{self.config.bq_table}_schema.json")
        if not os.path.isfile(schema_file):
            schema_file = os.path.join("schemas", "postgres_test2_schema.json")

        df_to_load = df.copy()

        if os.path.isfile(schema_file):
            try:
                raw_schema = self.client.schema_from_json(schema_file)
                reconciled_schema: List[bigquery.SchemaField] = []
                for field in raw_schema:
                    if field.name not in df_to_load.columns:
                        df_to_load[field.name] = None
                        reconciled_schema.append(
                            bigquery.SchemaField(
                                name=field.name,
                                field_type=field.field_type,
                                mode="NULLABLE",
                                description=field.description,
                            )
                        )
                        logger.info("Reconciled missing schema field '%s' in DataFrame with NULLs.", field.name)
                    else:
                        reconciled_schema.append(field)

                declared_names = {f.name for f in raw_schema}
                for col in df_to_load.columns:
                    if col not in declared_names:
                        reconciled_schema.append(
                            bigquery.SchemaField(
                                name=col,
                                field_type="STRING",
                                mode="NULLABLE",
                                description=f"Dynamically discovered column '{col}'",
                            )
                        )
                        logger.info("Appended dynamically discovered column '%s' to schema.", col)

                # Type-safe coercion
                for field in reconciled_schema:
                    col = field.name
                    f_type = field.field_type.upper()
                    if col in df_to_load.columns:
                        if f_type in ("INTEGER", "INT64"):
                            df_to_load[col] = pd.to_numeric(df_to_load[col], errors="coerce").astype("Int64")
                        elif f_type in ("FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC"):
                            df_to_load[col] = pd.to_numeric(df_to_load[col], errors="coerce")
                        elif f_type in ("TIMESTAMP", "DATETIME"):
                            df_to_load[col] = pd.to_datetime(df_to_load[col], errors="coerce", utc=True)
                        elif f_type in ("BOOLEAN", "BOOL"):
                            df_to_load[col] = df_to_load[col].map(
                                lambda v: True if str(v).strip().lower() in ("true", "1", "t", "yes")
                                else (False if str(v).strip().lower() in ("false", "0", "f", "no") else None)
                                if pd.notna(v) else None
                            ).astype("boolean")
                        elif f_type == "STRING":
                            df_to_load[col] = df_to_load[col].apply(lambda v: str(v) if pd.notna(v) else None)

                job_config.schema = reconciled_schema
                logger.info("Reconciled explicit BigQuery schema with %d fields", len(reconciled_schema))
            except Exception as exc:
                logger.error("Failed to parse schema from %s: %s", schema_file, exc)
                raise RuntimeError(f"Schema parsing error: {exc}") from exc
        else:
            job_config.autodetect = True

        if write_disposition == "WRITE_APPEND":
            job_config.schema_update_options = [
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
                bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
            ]

        try:
            job = self.client.load_table_from_dataframe(df_to_load, table_ref, job_config=job_config)
            job.result()
            loaded_count = len(df_to_load)
            logger.info("Successfully loaded %d records into BigQuery table '%s'", loaded_count, table_ref)
            return loaded_count
        except Exception as exc:
            logger.error("BigQuery load job failed for '%s': %s", table_ref, exc)
            raise RuntimeError(f"BigQuery load failed: {exc}") from exc
