"""Standalone ETL Runner: sales_etl
Architecture: PostgreSQL (raw_sales_orders) -> Cleansing & Quarantine -> BigQuery (dev_sales.fct_sales_orders_v1)
Partitioned by: order_date

Zero-mock policy: if credentials or sources are unavailable, raises an error immediately.
"""
import os
import sys
import re
import json
import logging
import argparse
import math
from datetime import datetime, date, timezone
from typing import Dict, Any, List

try:
    import pandas as pd
    import numpy as np
except ImportError:
    pd = None
    np = None

try:
    import pyarrow as pa
    import pyarrow.parquet as pq
except ImportError:
    pa = None
    pq = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("sales_etl")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class QuarantineManager:
    """Manages dead-letter logging and quality audit metrics for quarantined records."""
    def __init__(self):
        self.quarantined_records: List[Dict[str, Any]] = []
        self.reason_counts: Dict[str, int] = {
            "ERR_MISSING_OR_INVALID_AMOUNT": 0,
            "ERR_INVALID_EMAIL_FORMAT": 0,
            "ERR_INVALID_ORDER_DATE": 0,
            "ERR_MISSING_ORDER_ID": 0,
        }

    def record_rejection(self, record: Dict[str, Any], reason_code: str, detail: str = ""):
        self.reason_counts[reason_code] = self.reason_counts.get(reason_code, 0) + 1
        quarantine_entry = {
            "record": record,
            "reason_code": reason_code,
            "detail": detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.quarantined_records.append(quarantine_entry)
        logger.warning("Record rejected [%s]: %s (Order ID: %s)", reason_code, detail, record.get("order_id"))

    @property
    def total_quarantined(self) -> int:
        return len(self.quarantined_records)


class SalesDataCleanser:
    """Validates and cleans sales orders according to enterprise data quality rules."""
    def __init__(self, quarantine_manager: QuarantineManager = None):
        self.quarantine_manager = quarantine_manager or QuarantineManager()

    @staticmethod
    def is_valid_email(email: Any) -> bool:
        if not email or not isinstance(email, str):
            return False
        email_str = email.strip()
        if not email_str:
            return False
        return bool(EMAIL_REGEX.match(email_str))

    @staticmethod
    def is_valid_amount(amount: Any) -> bool:
        if amount is None:
            return False
        if pd is not None and pd.isna(amount):
            return False
        try:
            val = float(amount)
            if math.isnan(val) or math.isinf(val):
                return False
            return val > 0.0
        except (ValueError, TypeError):
            return False

    @staticmethod
    def is_valid_date(date_val: Any) -> bool:
        if date_val is None or (pd is not None and pd.isna(date_val)):
            return False
        if isinstance(date_val, (datetime, date)):
            return True
        date_str = str(date_val).strip()
        if not date_str:
            return False
        try:
            if pd is not None:
                pd.to_datetime(date_str)
            else:
                datetime.fromisoformat(date_str)
            return True
        except Exception:
            return False

    def clean_records(self, data: Any) -> Any:
        """Cleans and filters records, routing invalid rows to quarantine."""
        if data is None:
            return pd.DataFrame() if pd is not None else []

        is_df = pd is not None and isinstance(data, pd.DataFrame)
        if is_df:
            if data.empty:
                return pd.DataFrame()
            records_list = [row.to_dict() for _, row in data.iterrows()]
        elif isinstance(data, list):
            records_list = data
        else:
            records_list = list(data)

        valid_rows = []
        now_ts = datetime.now(timezone.utc)

        for record in records_list:
            order_id = record.get("order_id")
            amount = record.get("amount")
            customer_email = record.get("customer_email")
            order_date = record.get("order_date")

            # Check order_id
            if not order_id or (pd is not None and pd.isna(order_id)) or str(order_id).strip() == "":
                self.quarantine_manager.record_rejection(
                    record, "ERR_MISSING_ORDER_ID", "Missing or empty order_id"
                )
                continue

            # Check amount: non-null, > 0
            if not self.is_valid_amount(amount):
                self.quarantine_manager.record_rejection(
                    record, "ERR_MISSING_OR_INVALID_AMOUNT", f"Amount is null, non-numeric, or <= 0 (value: {amount})"
                )
                continue

            # Check email: RFC compliant regex
            if not self.is_valid_email(customer_email):
                self.quarantine_manager.record_rejection(
                    record, "ERR_INVALID_EMAIL_FORMAT", f"Invalid email format (value: {customer_email})"
                )
                continue

            # Check order_date: valid date
            if not self.is_valid_date(order_date):
                self.quarantine_manager.record_rejection(
                    record, "ERR_INVALID_ORDER_DATE", f"Invalid order date format (value: {order_date})"
                )
                continue

            # Clean and standardize record
            if pd is not None:
                parsed_date = pd.to_datetime(order_date).date()
            elif isinstance(order_date, (datetime, date)):
                parsed_date = order_date if isinstance(order_date, date) else order_date.date()
            else:
                parsed_date = datetime.fromisoformat(str(order_date).strip()).date()

            cleaned_row = {
                "order_id": str(order_id).strip(),
                "customer_id": str(record.get("customer_id")).strip() if record.get("customer_id") and not (pd is not None and pd.isna(record.get("customer_id"))) else None,
                "customer_name": str(record.get("customer_name")).strip() if record.get("customer_name") and not (pd is not None and pd.isna(record.get("customer_name"))) else None,
                "customer_email": str(customer_email).strip(),
                "order_date": parsed_date,
                "amount": float(amount),
                "currency": str(record.get("currency", "USD")).strip().upper() if record.get("currency") and not (pd is not None and pd.isna(record.get("currency"))) else "USD",
                "status": str(record.get("status", "COMPLETED")).strip().upper() if record.get("status") and not (pd is not None and pd.isna(record.get("status"))) else "COMPLETED",
                "extracted_at": record.get("extracted_at") or now_ts,
                "loaded_at": now_ts,
            }
            valid_rows.append(cleaned_row)

        if is_df:
            return pd.DataFrame(valid_rows)
        return valid_rows


class PostgresExtractor:
    """Extracts raw sales orders from PostgreSQL source table."""
    def __init__(self, table_name: str = "raw_sales_orders"):
        self.table_name = table_name

    def get_connection_url(self) -> str:
        db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DB_URL") or os.getenv("POSTGRES_URL")
        if not db_url:
            host = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST", "")
            port = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432")
            user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "")
            password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD", "")
            dbname = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "")
            if user and host and dbname:
                db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

        if not db_url:
            raise EnvironmentError(
                "FATAL: DATABASE_URL, POSTGRES_DB_URL, or POSTGRES_* connection environment variables "
                "must be configured. Mock dummy data generation is completely disabled."
            )
        return db_url

    def extract(self) -> Any:
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for pipeline extraction.")
        db_url = self.get_connection_url()
        query = f"SELECT * FROM {self.table_name}"
        logger.info("Executing extraction query against PostgreSQL: %s", query)
        df = pd.read_sql(query, con=db_url)
        df["extracted_at"] = datetime.now(timezone.utc)
        logger.info("Extracted %d raw records from PostgreSQL table %s", len(df), self.table_name)
        return df


class BigQueryLoader:
    """Loads validated sales records into BigQuery table partitioned by order_date."""
    def __init__(self, dataset_id: str = "dev_sales", table_id: str = "fct_sales_orders_v1", write_mode: str = "append"):
        self.dataset_id = dataset_id
        self.table_id = table_id
        self.write_mode = write_mode

    def load(self, data: Any) -> bool:
        if data is None or (hasattr(data, "__len__") and len(data) == 0):
            logger.warning("No clean records to load into BigQuery. Skipping load phase.")
            return True

        project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID")
        if not project_id:
            raise EnvironmentError("FATAL: GCP_PROJECT_ID or PROJECT_ID must be set for BigQuery loading.")

        from google.cloud import bigquery
        client = bigquery.Client(project=project_id)
        table_ref = f"{project_id}.{self.dataset_id}.{self.table_id}"

        job_config = bigquery.LoadJobConfig(
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND if self.write_mode == "append" else bigquery.WriteDisposition.WRITE_TRUNCATE,
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="order_date",
            ),
            clustering_fields=["customer_id", "status"],
            schema=[
                bigquery.SchemaField("order_id", "STRING", mode="REQUIRED", description="Unique sales order identifier"),
                bigquery.SchemaField("customer_id", "STRING", mode="NULLABLE", description="Identifier for customer"),
                bigquery.SchemaField("customer_name", "STRING", mode="NULLABLE", description="Customer full name"),
                bigquery.SchemaField("customer_email", "STRING", mode="REQUIRED", description="Validated customer email address"),
                bigquery.SchemaField("order_date", "DATE", mode="REQUIRED", description="Transaction date - Partitioning Column"),
                bigquery.SchemaField("amount", "NUMERIC", mode="REQUIRED", description="Cleaned transaction sales amount"),
                bigquery.SchemaField("currency", "STRING", mode="NULLABLE", description="Transaction currency code (e.g., USD)"),
                bigquery.SchemaField("status", "STRING", mode="NULLABLE", description="Order status"),
                bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="NULLABLE", description="Timestamp when record was extracted from PostgreSQL"),
                bigquery.SchemaField("loaded_at", "TIMESTAMP", mode="NULLABLE", description="Timestamp when record was loaded into BigQuery"),
            ]
        )

        row_count = len(data)
        logger.info("Starting BigQuery load job into %s (%d rows)...", table_ref, row_count)
        if pd is not None and isinstance(data, pd.DataFrame):
            job = client.load_table_from_dataframe(data, table_ref, job_config=job_config)
        else:
            job = client.load_table_from_json(data, table_ref, job_config=job_config)
        job.result()  # Wait for job completion

        if job.errors:
            raise RuntimeError(f"FATAL: BigQuery load job failed: {job.errors}")

        logger.info("Successfully loaded %d records into BigQuery table: %s", row_count, table_ref)
        return True


class PipelineRunner:
    """Orchestrates extraction, cleansing, staging, and BigQuery ingestion."""
    def __init__(self, execution_date: str = None, source_table: str = "raw_sales_orders", target_dataset: str = "dev_sales", target_table: str = "fct_sales_orders_v1"):
        self.execution_date = execution_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.staging_dir = os.path.join("staging", "sales_etl", self.execution_date)
        os.makedirs(self.staging_dir, exist_ok=True)
        self.staging_file = os.path.join(self.staging_dir, "clean_sales_orders.parquet")

        self.quarantine_manager = QuarantineManager()
        self.extractor = PostgresExtractor(table_name=source_table)
        self.cleanser = SalesDataCleanser(quarantine_manager=self.quarantine_manager)
        self.loader = BigQueryLoader(dataset_id=target_dataset, table_id=target_table)

    def run(self) -> int:
        start_time = datetime.now(timezone.utc)
        logger.info("=== Starting Sales ETL Pipeline [%s] ===", self.execution_date)
        try:
            # 1. Extraction
            raw_df = self.extractor.extract()
            total_extracted = len(raw_df)

            # 2. Cleansing & Validation
            clean_df = self.cleanser.clean_records(raw_df)
            total_valid = len(clean_df) if clean_df is not None else 0
            total_quarantined = self.quarantine_manager.total_quarantined

            # 3. Stage locally to Parquet
            if clean_df is not None and len(clean_df) > 0 and pd is not None and isinstance(clean_df, pd.DataFrame):
                clean_df.to_parquet(self.staging_file, index=False)
                logger.info("Staged %d validated records to %s", total_valid, self.staging_file)

            # 4. Load into BigQuery
            self.loader.load(clean_df)

            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()

            summary = {
                "pipeline_name": "sales_etl",
                "execution_date": self.execution_date,
                "status": "COMPLETED",
                "duration_seconds": duration,
                "metrics": {
                    "records_extracted": total_extracted,
                    "records_valid": total_valid,
                    "records_quarantined": total_quarantined,
                    "filtered_missing_or_invalid_amount": self.quarantine_manager.reason_counts.get("ERR_MISSING_OR_INVALID_AMOUNT", 0),
                    "filtered_invalid_email": self.quarantine_manager.reason_counts.get("ERR_INVALID_EMAIL_FORMAT", 0),
                    "filtered_invalid_order_date": self.quarantine_manager.reason_counts.get("ERR_INVALID_ORDER_DATE", 0),
                    "filtered_missing_order_id": self.quarantine_manager.reason_counts.get("ERR_MISSING_ORDER_ID", 0),
                    "records_loaded": total_valid,
                }
            }
            logger.info("ETL Execution Summary:\n%s", json.dumps(summary, indent=2))
            logger.info("=== Pipeline Execution Finished Successfully ===")
            return 0
        except Exception as exc:
            logger.critical("Pipeline execution FAILED: %s", exc, exc_info=True)
            return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PostgreSQL to BigQuery Sales ETL Pipeline Runner")
    parser.add_argument("--date", help="Execution date (YYYY-MM-DD)", default=None)
    parser.add_argument("--source-table", help="Source PostgreSQL table", default="raw_sales_orders")
    parser.add_argument("--target-dataset", help="BigQuery dataset", default="dev_sales")
    parser.add_argument("--target-table", help="BigQuery table", default="fct_sales_orders_v1")
    args = parser.parse_args()

    runner = PipelineRunner(
        execution_date=args.date,
        source_table=args.source_table,
        target_dataset=args.target_dataset,
        target_table=args.target_table,
    )
    sys.exit(runner.run())
