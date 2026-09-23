"""Data cleaning and transformation module."""
import os
import re
import sys
import logging
from datetime import datetime
import pandas as pd

logger = logging.getLogger("pipeline.transform")

_FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
_NUMERIC_STRIP_RE = re.compile(r"[,$€£¥\s\u00a0]")


def _normalize_numeric_series(series: pd.Series) -> pd.Series:
    """Strip footnote annotations, currency symbols, thousands separators, and whitespace."""
    return (
        series.astype(str)
        .str.replace(_FOOTNOTE_RE, "", regex=True)
        .str.replace(_NUMERIC_STRIP_RE, "", regex=True)
        .str.strip()
    )


def transform_staging_data(staging_file: str) -> int:
    """Cleans, standardizes, and validates staged Parquet records."""
    if not os.path.exists(staging_file) or os.path.getsize(staging_file) == 0:
        logger.warning("Staging file is empty or missing: %s", staging_file)
        return 0

    df = pd.read_parquet(staging_file)
    raw_count = len(df)
    if raw_count == 0:
        logger.warning("Staging DataFrame is empty.")
        return 0

    # 1. Standardize column names
    df.columns = [
        re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
        for col in df.columns
    ]

    # 2. Date / Timestamp parsing
    for col in df.columns:
        if pd.api.types.is_string_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
            sample = df[col].dropna().head(5)
            if not sample.empty:
                parsed = pd.to_datetime(sample, errors="coerce")
                if parsed.notna().sum() >= max(1, len(sample) * 0.6):
                    df[col] = pd.to_datetime(df[col], errors="coerce")

    # 3. Numeric type coercion
    for col in df.columns:
        if pd.api.types.is_string_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
            sample = df[col].dropna().head(10)
            if not sample.empty:
                cleaned_sample = _normalize_numeric_series(sample)
                coerced = pd.to_numeric(cleaned_sample, errors="coerce")
                if coerced.notna().sum() >= max(1, len(sample) * 0.8):
                    _coerced = pd.to_numeric(_normalize_numeric_series(df[col]), errors="coerce")
                    _valid = _coerced.dropna()
                    if not _valid.empty and (_valid % 1 == 0).all():
                        df[col] = _coerced.astype("Int64")
                    else:
                        df[col] = _coerced

    # 4. Whitespace trimming & string null standardizations
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"nan": None, "None": None, "": None})

    # 5. Row validity filtering
    df_valid = df.dropna(how="all")
    quarantined = raw_count - len(df_valid)

    # 6. Circuit breaker
    if raw_count > 0 and len(df_valid) == 0:
        logger.error("FATAL: 100%% of %d records quarantined. Failing pipeline.", raw_count)
        sys.exit(1)

    # 7. Add audit timestamp & save
    df_valid = df_valid.copy()
    df_valid["ingested_at"] = datetime.utcnow().isoformat()
    df_valid.to_parquet(staging_file, index=False)
    logger.info("Transform completed. raw=%d, valid=%d, quarantined=%d", raw_count, len(df_valid), quarantined)
    return len(df_valid)
