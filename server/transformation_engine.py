"""Transformation & Deduplication Engine for Sales Order ETL Pipeline.

Cleanses raw sales order records, sanitizes data types, derives partition keys,
and performs deterministic deduplication on primary key order_id.
"""

from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, Optional, Tuple
import pandas as pd

logger = logging.getLogger("sales_order_etl.transformer")

NULL_VALUES = {"", "n/a", "null", "none", "nan", "-", "nil", "undefined"}


class TransformationEngine:
    """Engine responsible for data cleaning, sanitization, and deduplication."""

    @staticmethod
    def sanitize_nulls(val: Any) -> Any:
        """Converts null-like string representations into None."""
        if val is None or pd.isna(val):
            return None
        if isinstance(val, str):
            val_clean = val.strip()
            if val_clean.lower() in NULL_VALUES:
                return None
            return val_clean
        return val

    @staticmethod
    def parse_numeric(val: Any) -> Optional[float]:
        """Parses monetary amount, stripping currency symbols and formatting."""
        if val is None or pd.isna(val):
            return None
        if isinstance(val, (int, float)):
            return float(val)
        val_str = str(val).strip()
        if val_str.lower() in NULL_VALUES:
            return None
        # Remove currency symbols ($, EUR, etc.) and commas
        cleaned = re.sub(r"[^\d.-]", "", val_str)
        try:
            return float(cleaned) if cleaned else None
        except ValueError:
            return None

    @staticmethod
    def parse_timestamp(val: Any) -> Optional[pd.Timestamp]:
        """Parses a timestamp string into a timezone-aware UTC pd.Timestamp."""
        if val is None or pd.isna(val):
            return None
        val_str = str(val).strip()
        if val_str.lower() in NULL_VALUES:
            return None
        try:
            ts = pd.to_datetime(val_str, utc=True)
            return ts
        except Exception:
            return None

    def transform(
        self, raw_df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Executes the full transformation and deduplication pipeline.

        Args:
            raw_df: Raw DataFrame extracted from GCS.

        Returns:
            Tuple of (cleaned_deduplicated_df, metrics_dict)
        """
        if raw_df is None or raw_df.empty:
            logger.warning("Empty DataFrame provided for transformation")
            return pd.DataFrame(), {
                "records_ingested": 0,
                "records_cleaned": 0,
                "records_deduplicated": 0,
                "records_loaded": 0,
            }

        records_ingested = len(raw_df)
        df = raw_df.copy()

        logger.info(
            "Starting data transformation",
            extra={"event": "TRANSFORM_START", "input_records": records_ingested},
        )

        # 1. Clean column names (strip whitespace and lower/standardize)
        df.columns = [c.strip().lower() for c in df.columns]

        # 2. Trim whitespace across all object/string columns & sanitize nulls
        for col in df.columns:
            if df[col].dtype == "object":
                df[col] = df[col].apply(self.sanitize_nulls)

        # 3. Filter out records missing primary key 'order_id'
        if "order_id" not in df.columns:
            raise KeyError("Mandatory column 'order_id' missing from source dataset")

        df["order_id"] = df["order_id"].astype(str).apply(self.sanitize_nulls)
        initial_count = len(df)
        df = df[df["order_id"].notna() & (df["order_id"] != "")]
        dropped_missing_pk = initial_count - len(df)
        if dropped_missing_pk > 0:
            logger.warning(
                "Dropped records missing order_id",
                extra={"dropped_count": dropped_missing_pk},
            )

        # 4. Standardize timestamps and derive order_date
        if "created_at" in df.columns:
            df["created_at"] = df["created_at"].apply(self.parse_timestamp)
        else:
            df["created_at"] = None

        if "order_date" in df.columns and df["order_date"].notna().any():
            df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce").dt.date
            # Fallback to created_at date if order_date is null
            df["order_date"] = df["order_date"].fillna(
                df["created_at"].dt.date if df["created_at"].notna().any() else pd.NA
            )
        else:
            if df["created_at"].notna().any():
                df["order_date"] = df["created_at"].dt.date
            else:
                current_date = datetime.now(timezone.utc).date()
                df["order_date"] = current_date

        # Fallback any remaining null order_dates to current date
        now_date = datetime.now(timezone.utc).date()
        df["order_date"] = df["order_date"].fillna(now_date)

        # 5. Clean numeric amount
        if "amount" in df.columns:
            df["amount"] = df["amount"].apply(self.parse_numeric)
        else:
            df["amount"] = None

        # 6. Normalize status and currency
        if "order_status" in df.columns:
            df["order_status"] = df["order_status"].astype(str).str.upper().apply(self.sanitize_nulls)
        if "currency" in df.columns:
            df["currency"] = df["currency"].astype(str).str.upper().apply(self.sanitize_nulls)

        # 7. Deduplicate on order_id, retaining the most recent record
        pre_dedup_count = len(df)
        if df["created_at"].notna().any():
            # Sort by created_at descending (nulls last) so the latest record comes first
            df = df.sort_values(by=["order_id", "created_at"], ascending=[True, False], na_position="last")
        df = df.drop_duplicates(subset=["order_id"], keep="first")
        records_deduplicated = pre_dedup_count - len(df)

        # 8. Add pipeline ingestion timestamp
        current_ingestion_ts = datetime.now(timezone.utc)
        df["ingestion_timestamp"] = current_ingestion_ts

        # 9. Ensure all target schema columns exist
        target_columns = [
            "order_id",
            "order_date",
            "customer_id",
            "customer_name",
            "customer_email",
            "product_category",
            "amount",
            "currency",
            "order_status",
            "created_at",
            "ingestion_timestamp",
        ]
        for col in target_columns:
            if col not in df.columns:
                df[col] = None

        # Reorder to standard schema
        df = df[target_columns]

        records_loaded = len(df)
        metrics = {
            "records_ingested": records_ingested,
            "records_cleaned": records_ingested - dropped_missing_pk,
            "records_deduplicated": records_deduplicated,
            "records_loaded": records_loaded,
        }

        logger.info(
            "Transformation and deduplication complete",
            extra={"event": "TRANSFORM_SUCCESS", **metrics},
        )
        return df, metrics
