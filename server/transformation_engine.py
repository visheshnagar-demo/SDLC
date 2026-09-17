"""Transformation & Deduplication Engine for Sales Order ETL Pipeline.

Cleanses raw sales order records, sanitizes data types, derives partition keys,
and performs deterministic deduplication on primary key order_id.
"""

from datetime import datetime, timezone
import logging
import math
import re
from typing import Any, Dict, Optional, Tuple
import numpy as np
import pandas as pd

logger = logging.getLogger("sales_order_etl.transformer")

NULL_VALUES = {
    "",
    "n/a",
    "na",
    "null",
    "none",
    "nan",
    "<na>",
    "nat",
    "-",
    "--",
    "---",
    "nil",
    "undefined",
    "?",
    "??",
    "#n/a",
    "#na",
    "#value!",
    "#ref!",
    "null\n",
    "none\n",
    "nan\n",
    "n/a\n",
}


class TransformationEngine:
    """Engine responsible for data cleaning, sanitization, and deduplication."""

    @staticmethod
    def is_null_value(val: Any) -> bool:
        """Determines whether a value is null, NaN, pd.NA, or a null-like placeholder."""
        if val is None:
            return True
        try:
            if pd.isna(val):
                return True
        except Exception:
            pass
        if isinstance(val, float) and (math.isnan(val) or val != val or str(val).lower() == "nan"):
            return True
        if isinstance(val, str):
            val_clean = val.strip().lower()
            return val_clean in NULL_VALUES or not val_clean
        return False

    @staticmethod
    def sanitize_nulls(val: Any) -> Any:
        """Converts null-like string representations and NaNs into Python None, and trims whitespace from strings."""
        if TransformationEngine.is_null_value(val):
            return None
        if isinstance(val, str):
            return val.strip()
        return val

    @staticmethod
    def clean_string(val: Any) -> Optional[str]:
        """Trims whitespace and converts null-like values or NaNs into strictly Python None (NoneType).

        Returns stripped string or None.
        """
        if TransformationEngine.is_null_value(val):
            return None
        val_str = str(val).strip()
        if not val_str or val_str.lower() in NULL_VALUES:
            return None
        return val_str

    @staticmethod
    def parse_numeric(val: Any) -> Optional[float]:
        """Parses monetary amount, stripping currency symbols and formatting."""
        if TransformationEngine.is_null_value(val):
            return None
        if isinstance(val, (int, float)):
            return float(val)
        val_str = str(val).strip()
        if not val_str or val_str.lower() in NULL_VALUES:
            return None
        # Remove currency symbols ($, EUR, etc.) and commas
        cleaned = re.sub(r"[^\d.-]", "", val_str)
        try:
            return float(cleaned) if cleaned and cleaned not in {"-", ".", "-."} else None
        except ValueError:
            return None

    @staticmethod
    def parse_timestamp(val: Any) -> Optional[pd.Timestamp]:
        """Parses a timestamp string or object into a timezone-aware UTC pd.Timestamp."""
        if TransformationEngine.is_null_value(val):
            return None
        if isinstance(val, pd.Timestamp):
            if pd.isna(val):
                return None
            if val.tz is None:
                return val.tz_localize("UTC")
            return val.tz_convert("UTC")
        if isinstance(val, datetime):
            if val.tzinfo is None:
                return pd.Timestamp(val, tz="UTC")
            return pd.Timestamp(val).tz_convert("UTC")
        val_str = str(val).strip()
        if not val_str or val_str.lower() in NULL_VALUES:
            return None
        try:
            ts = pd.to_datetime(val_str, utc=True)
            if pd.isna(ts):
                return None
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
        df.columns = [str(c).strip().lower() for c in df.columns]

        # 2. Filter out records missing primary key 'order_id'
        if "order_id" not in df.columns:
            raise KeyError("Mandatory column 'order_id' missing from source dataset")

        df["order_id"] = df["order_id"].apply(self.clean_string)
        initial_count = len(df)
        df = df[df["order_id"].notna() & (df["order_id"] != "")]
        dropped_missing_pk = initial_count - len(df)
        if dropped_missing_pk > 0:
            logger.warning(
                "Dropped records missing order_id",
                extra={"dropped_count": dropped_missing_pk},
            )

        if df.empty:
            return pd.DataFrame(), {
                "records_ingested": records_ingested,
                "records_cleaned": 0,
                "records_deduplicated": 0,
                "records_loaded": 0,
            }

        # 3. Standardize timestamps and derive order_date
        if "created_at" in df.columns:
            df["created_at"] = df["created_at"].apply(self.parse_timestamp)
        else:
            df["created_at"] = None

        if "order_date" in df.columns and df["order_date"].notna().any():
            parsed_order_date = pd.to_datetime(df["order_date"], errors="coerce").dt.date
            if "created_at" in df.columns and df["created_at"].notna().any():
                created_at_dates = df["created_at"].apply(
                    lambda ts: ts.date() if ts is not None and not pd.isna(ts) else None
                )
                parsed_order_date = parsed_order_date.combine_first(created_at_dates)
            df["order_date"] = parsed_order_date
        else:
            if "created_at" in df.columns and df["created_at"].notna().any():
                df["order_date"] = df["created_at"].apply(
                    lambda ts: ts.date() if ts is not None and not pd.isna(ts) else None
                )
            else:
                df["order_date"] = None

        now_date = datetime.now(timezone.utc).date()
        df["order_date"] = df["order_date"].apply(
            lambda d: now_date if d is None or pd.isna(d) else d
        )

        # 4. Clean numeric amount
        if "amount" in df.columns:
            df["amount"] = df["amount"].apply(self.parse_numeric)
        else:
            df["amount"] = None

        # 5. Clean and normalize string fields
        for col in ["customer_id", "customer_name", "customer_email", "product_category"]:
            if col in df.columns:
                df[col] = df[col].apply(self.clean_string)
            else:
                df[col] = None

        if "currency" in df.columns:
            df["currency"] = df["currency"].apply(
                lambda v: self.clean_string(v).upper() if self.clean_string(v) is not None else None
            )
        else:
            df["currency"] = None

        if "order_status" in df.columns:
            df["order_status"] = df["order_status"].apply(
                lambda v: self.clean_string(v).upper() if self.clean_string(v) is not None else None
            )
        else:
            df["order_status"] = None

        # 6. Deduplicate on order_id, retaining the most recent record
        pre_dedup_count = len(df)
        if "created_at" in df.columns and df["created_at"].notna().any():
            df = df.sort_values(by=["order_id", "created_at"], ascending=[True, False], na_position="last")
        df = df.drop_duplicates(subset=["order_id"], keep="first")
        records_deduplicated = pre_dedup_count - len(df)

        # 7. Add pipeline ingestion timestamp
        current_ingestion_ts = datetime.now(timezone.utc)
        df["ingestion_timestamp"] = current_ingestion_ts

        # 8. Ensure all target schema columns exist and reorder
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
        df = df[target_columns].copy()

        # Final pass on all string columns to guarantee strictly Python None (NoneType) for any null/NaN/placeholder
        string_columns = [
            "order_id",
            "customer_id",
            "customer_name",
            "customer_email",
            "product_category",
            "currency",
            "order_status",
        ]
        for col in string_columns:
            df[col] = df[col].apply(self.clean_string)

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
