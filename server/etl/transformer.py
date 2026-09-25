"""Data Transformation & Cleaning Module.
Performs in-flight data cleansing, whitespace trimming, null normalization,
and type coercion for BigQuery loading.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Optional, Any

try:
    import numpy as np
except (ImportError, Exception):
    np = None

try:
    import pandas as pd
except (ImportError, Exception):
    pd = None

logger = logging.getLogger("server.etl.transformer")

NULL_SENTINEL_VALUES = {"", "nan", "NAN", "null", "NULL", "None", "none", "N/A", "n/a", "NA"}


def clean_string_value(val: Any) -> Optional[str]:
    """Safely trims whitespace and normalizes empty / sentinel strings to None."""
    if val is None:
        return None
    if pd is not None and pd.isna(val):
        return None
    s = str(val).strip()
    if s in NULL_SENTINEL_VALUES:
        return None
    return s


def transform_and_clean_data(df: Any) -> Any:
    """Cleans and standardizes raw DataFrame records before loading into BigQuery.

    Transformations:
    1. Standardizes column names (lowercase, alphanumeric + underscore).
    2. Strips leading and trailing whitespace on string columns.
    3. Normalizes empty and sentinel strings to None.
    4. Coerces date/timestamp fields to UTC datetime objects.
    5. Discards fully empty rows.
    6. Appends etl_loaded_at timestamp column.
    """
    if df is None:
        raise ValueError("Input DataFrame is None")

    if pd is None:
        raise RuntimeError("pandas is required for DataFrame transformation")

    raw_count = len(df)
    if raw_count == 0:
        logger.warning("Empty DataFrame passed to transformer; returning empty result.")
        return pd.DataFrame()

    logger.info("Transforming %d raw records. Raw columns: %s", raw_count, list(df.columns))

    df_clean = df.copy()

    # 1. Standardize column names
    df_clean.columns = [
        re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
        for col in df_clean.columns
    ]

    # 2. String fields cleansing & null normalization
    for col in df_clean.columns:
        if col in ["id", "data_payload", "status"]:
            df_clean[col] = df_clean[col].apply(clean_string_value)
        elif df_clean[col].dtype == object:
            df_clean[col] = df_clean[col].apply(clean_string_value)

    # 3. Timestamp coercion
    for ts_col in ["created_at", "updated_at"]:
        if ts_col in df_clean.columns:
            df_clean[ts_col] = pd.to_datetime(df_clean[ts_col], errors="coerce", utc=True)

    # 4. Filter completely null rows
    df_valid = df_clean.dropna(how="all").copy()
    quarantined = raw_count - len(df_valid)
    if quarantined > 0:
        logger.warning("Quarantined %d completely empty records.", quarantined)

    # 5. Circuit Breaker
    if raw_count > 0 and len(df_valid) == 0:
        logger.error(
            "CIRCUIT BREAKER TRIGGERED: 100%% of %d records failed data validation.",
            raw_count,
        )
        raise RuntimeError("Circuit breaker triggered: 100% of records were quarantined during transformation.")

    # 6. Audit timestamp
    df_valid["etl_loaded_at"] = datetime.now(timezone.utc)

    logger.info("Transformation finished: %d valid records ready for load.", len(df_valid))
    return df_valid
