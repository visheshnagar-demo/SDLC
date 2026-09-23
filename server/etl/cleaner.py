"""Data Cleaning and Transformation Module for ETL Pipeline."""
import logging
from datetime import datetime, timezone
from typing import List, Optional

try:
    import numpy as np
except ImportError:
    np = None

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)

NULL_EQUIVALENTS = {"", "null", "none", "n/a", "nan", "nil", "undefined"}


class DataCleaner:
    """Performs deterministic cleaning, normalization, deduplication, and schema enrichment."""

    def __init__(self, key_columns: Optional[List[str]] = None):
        self.key_columns = key_columns or ["id"]

    def clean(self, df):
        """Cleans input DataFrame according to specified business rules."""
        if df is None:
            raise ValueError("Input DataFrame cannot be None.")

        if getattr(df, "empty", False):
            logger.warning("Received empty DataFrame for cleaning.")
            df_out = df.copy()
            if "_etl_loaded_at" not in df_out.columns:
                if pd is not None:
                    df_out["_etl_loaded_at"] = pd.Series(dtype="datetime64[ns, UTC]")
                else:
                    df_out["_etl_loaded_at"] = []
            return df_out

        df_clean = df.copy()

        # 1. Whitespace trimming and null standardization for string/object columns
        nan_val = np.nan if np is not None else None
        for col in df_clean.columns:
            if (pd is not None and (df_clean[col].dtype == object or pd.api.types.is_string_dtype(df_clean[col]))) or (pd is None and hasattr(df_clean[col], "apply")):
                # Strip string values
                df_clean[col] = df_clean[col].apply(
                    lambda x: x.strip() if isinstance(x, str) else x
                )
                # Normalize pseudo-null values to np.nan
                df_clean[col] = df_clean[col].apply(
                    lambda x: nan_val if isinstance(x, str) and x.lower() in NULL_EQUIVALENTS else x
                )

        # 2. Timestamp normalization to UTC
        timestamp_cols = [
            c for c in df_clean.columns
            if any(term in c.lower() for term in ["time", "created", "updated", "date"])
            and c != "_etl_loaded_at"
        ]
        for col in timestamp_cols:
            if pd is not None:
                df_clean[col] = pd.to_datetime(df_clean[col], utc=True, errors="coerce")

        # 3. Deduplication
        dedup_keys = [k for k in self.key_columns if k in df_clean.columns]
        initial_len = len(df_clean)
        if dedup_keys:
            df_clean = df_clean.drop_duplicates(subset=dedup_keys, keep="first")
        else:
            df_clean = df_clean.drop_duplicates(keep="first")

        dropped_count = initial_len - len(df_clean)
        if dropped_count > 0:
            logger.info("Deduplication removed %d duplicate rows.", dropped_count)

        # 4. Add ETL load timestamp in UTC
        current_time = datetime.now(timezone.utc)
        df_clean["_etl_loaded_at"] = current_time

        logger.info("Cleaned dataset successfully: %d records ready for loading.", len(df_clean))
        return df_clean
