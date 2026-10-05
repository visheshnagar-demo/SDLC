"""Data Transformation and Deduplication Module for Sales ETL Pipeline.

Performs schema-on-read sanitization, deduplication on order_id, date derivations,
and circuit breaker validation.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger("sales_etl.transformer")


class SalesDataTransformer:
    """Transforms, sanitizes, deduplicates, and enriches sales order records."""

    def __init__(self, batch_id: str = None):
        self.batch_id = batch_id or str(uuid.uuid4())

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Executes full transformation and deduplication pipeline on raw DataFrame.

        Args:
            df: Raw DataFrame from GCS extraction.

        Returns:
            Tuple[pd.DataFrame, Dict[str, Any]]: Cleaned & deduplicated DataFrame, and batch metrics.

        Raises:
            ValueError: If input DataFrame is empty or fails circuit breaker validation.
        """
        if df is None or df.empty:
            raise ValueError("FATAL: Input DataFrame is empty. Circuit breaker triggered.")

        rows_extracted = len(df)
        logger.info("Starting transformation on %d raw records. Batch ID: %s", rows_extracted, self.batch_id)

        df_work = df.copy()

        # 1. Standardize column names
        df_work.columns = [str(c).strip().lower() for c in df_work.columns]

        # 2. String cleaning & Null normalization
        for col in df_work.columns:
            if df_work[col].dtype == object or isinstance(df_work[col].dtype, pd.StringDtype):
                df_work[col] = df_work[col].apply(
                    lambda v: v.strip() if isinstance(v, str) else v
                )
                df_work[col] = df_work[col].replace(
                    {"NULL": None, "None": None, "nan": None, "NaN": None, "N/A": None, "": None}
                )

        # 3. Primary Key validation & Coercion (order_id)
        if "order_id" not in df_work.columns:
            raise ValueError("FATAL: Critical identifier column 'order_id' missing from input data.")

        df_work["order_id"] = pd.to_numeric(df_work["order_id"], errors="coerce")
        # Filter out rows where order_id is null/invalid
        df_work = df_work.dropna(subset=["order_id"])
        if df_work.empty:
            raise ValueError("FATAL: All records had invalid or missing 'order_id'. Circuit breaker triggered.")

        df_work["order_id"] = df_work["order_id"].astype("int64")

        # 4. Numeric coercions (amount)
        if "amount" in df_work.columns:
            # Clean currency symbols or formatting if present
            if df_work["amount"].dtype == object:
                df_work["amount"] = (
                    df_work["amount"]
                    .astype(str)
                    .str.replace(r"[\$,€£¥\s]", "", regex=True)
                    .replace({"None": None, "nan": None, "": None})
                )
            df_work["amount"] = pd.to_numeric(df_work["amount"], errors="coerce")

        # 5. Timestamp parsing (created_at) & Date extraction (order_date)
        now_utc = datetime.now(timezone.utc)
        if "created_at" in df_work.columns:
            df_work["created_at"] = pd.to_datetime(df_work["created_at"], errors="coerce", utc=True)
            # Derive order_date from created_at
            df_work["order_date"] = df_work["created_at"].dt.date
            # Fill missing order_date with current date
            df_work["order_date"] = df_work["order_date"].fillna(now_utc.date())
        else:
            df_work["created_at"] = None
            df_work["order_date"] = now_utc.date()

        # Ensure order_date is a proper object/date or formatted string
        df_work["order_date"] = pd.to_datetime(df_work["order_date"]).dt.date

        # 6. Categorical string normalization
        for col in ["currency", "order_status"]:
            if col in df_work.columns:
                df_work[col] = df_work[col].apply(
                    lambda v: str(v).strip().upper() if pd.notna(v) and str(v).strip() not in ("", "NONE", "NAN", "NULL") else None
                )

        # Ensure customer fields exist
        for col in ["customer_id", "customer_name", "customer_email", "product_category"]:
            if col not in df_work.columns:
                df_work[col] = None
            else:
                df_work[col] = df_work[col].apply(
                    lambda v: str(v).strip() if pd.notna(v) and str(v).strip() not in ("", "NONE", "NAN", "NULL") else None
                )

        rows_cleaned = len(df_work)

        # 7. Deduplication on order_id
        df_dedup = df_work.drop_duplicates(subset=["order_id"], keep="last").copy()
        rows_deduplicated = len(df_dedup)
        duplicates_removed = rows_cleaned - rows_deduplicated

        logger.info(
            "Deduplication complete: %d rows before, %d rows after (%d duplicates removed)",
            rows_cleaned,
            rows_deduplicated,
            duplicates_removed,
        )

        # 8. Derived audit columns
        df_dedup["ingestion_timestamp"] = now_utc
        df_dedup["etl_batch_id"] = self.batch_id

        # 9. Schema alignment / column ordering
        target_columns = [
            "order_id",
            "customer_id",
            "customer_name",
            "customer_email",
            "product_category",
            "amount",
            "currency",
            "order_status",
            "created_at",
            "order_date",
            "ingestion_timestamp",
            "etl_batch_id",
        ]
        for col in target_columns:
            if col not in df_dedup.columns:
                df_dedup[col] = None

        df_result = df_dedup[target_columns].copy()

        metrics = {
            "batch_id": self.batch_id,
            "rows_extracted": rows_extracted,
            "rows_cleaned": rows_cleaned,
            "rows_deduplicated": rows_deduplicated,
            "duplicates_removed": duplicates_removed,
        }

        return df_result, metrics
