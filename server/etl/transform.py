"""Data Transformation and Deduplication Module."""
import logging
import re
from datetime import datetime, timezone
from typing import Tuple, Dict, Any
import pandas as pd
import numpy as np

logger = logging.getLogger("etl.transform")


def transform_and_deduplicate(df_raw: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Cleans, normalizes, type-casts, and deduplicates sales order records.

    Transformations:
      - Normalizes column names (snake_case).
      - Trims string columns and replaces empty strings with NaN / None.
      - Coerces order_id to Int64.
      - Strips currency symbols / comma separators and casts amount to float.
      - Coerces created_at to ISO 8601 UTC timestamp.
      - Deduplicates records on 'order_id', retaining the last seen record.
      - Appends ingested_at UTC audit timestamp.

    Circuit Breaker:
      - If 100% of raw records fail validation or are dropped, raises ValueError.
    """
    if df_raw is None or df_raw.empty:
        logger.warning("Received empty DataFrame for transformation.")
        return pd.DataFrame(), {
            "records_extracted": 0,
            "records_cleaned": 0,
            "duplicates_dropped": 0,
            "records_quarantined": 0,
        }

    raw_count = len(df_raw)
    df = df_raw.copy()

    # 1. Standardize column headers
    df.columns = [
        re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
        for col in df.columns
    ]

    # Helper regex for numeric cleaning
    _FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
    _NUMERIC_STRIP_RE = re.compile(r"[,$€£¥\s\u00a0]")

    def _clean_numeric(series: pd.Series) -> pd.Series:
        return (
            series.astype(str)
            .str.replace(_FOOTNOTE_RE, "", regex=True)
            .str.replace(_NUMERIC_STRIP_RE, "", regex=True)
            .str.strip()
        )

    # 2. Field-specific transformations
    if "order_id" in df.columns:
        df["order_id"] = _clean_numeric(df["order_id"])
        df["order_id"] = pd.to_numeric(df["order_id"], errors="coerce").astype("Int64")

    if "amount" in df.columns:
        df["amount"] = _clean_numeric(df["amount"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)

    string_cols = ["customer_id", "customer_name", "customer_email", "product_category", "currency", "order_status"]
    for col in string_cols:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
                .replace({"nan": None, "None": None, "<NA>": None, "": None})
            )

    # Clean any other remaining object/string columns
    for col in df.select_dtypes(include=["object"]).columns:
        if col not in string_cols:
            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
                .replace({"nan": None, "None": None, "<NA>": None, "": None})
            )

    # 3. Validity Filtering (must have valid non-null order_id)
    if "order_id" in df.columns:
        valid_mask = df["order_id"].notna()
        quarantined_count = int((~valid_mask).sum())
        df = df[valid_mask].copy()
    else:
        quarantined_count = 0

    # 4. Deduplication by primary key (order_id)
    if "order_id" in df.columns and not df.empty:
        pre_dedup_count = len(df)
        df = df.drop_duplicates(subset=["order_id"], keep="last")
        duplicates_dropped = pre_dedup_count - len(df)
    else:
        duplicates_dropped = 0

    cleaned_count = len(df)

    # 5. Circuit Breaker
    if raw_count > 0 and cleaned_count == 0:
        logger.critical(
            "CIRCUIT BREAKER: 100%% of %d raw records failed transformation/validation.",
            raw_count
        )
        raise ValueError(
            f"Circuit breaker triggered: 0 of {raw_count} records survived cleaning and deduplication."
        )

    # 6. Audit timestamp
    df["ingested_at"] = datetime.now(timezone.utc)

    metrics = {
        "records_extracted": raw_count,
        "records_cleaned": cleaned_count,
        "duplicates_dropped": duplicates_dropped,
        "records_quarantined": quarantined_count,
    }

    logger.info(
        "Transformation summary: extracted=%d, cleaned=%d, duplicates_dropped=%d, quarantined=%d",
        raw_count, cleaned_count, duplicates_dropped, quarantined_count,
    )
    return df, metrics
