"""ETL Transformation & Data Cleaning Engine."""
import re
from datetime import datetime
from typing import Tuple, List, Dict, Any, Optional
import pandas as pd
from server.etl.logger import get_logger

logger = get_logger("transformer")

_FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
_NUMERIC_STRIP_RE = re.compile(r"[,$€£¥\s\u00a0]")


def normalize_numeric_series(series: pd.Series) -> pd.Series:
    """Strip footnote annotations, currency symbols, thousands separators, and whitespace."""
    return (
        series.astype(str)
        .str.replace(_FOOTNOTE_RE, "", regex=True)
        .str.replace(_NUMERIC_STRIP_RE, "", regex=True)
        .str.strip()
    )


def clean_and_transform_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
    """Applies standard data cleaning and fundamental transformations to the input DataFrame.
    
    Returns:
        Tuple of (transformed_df, duplicates_dropped_count)
    """
    if df.empty:
        logger.warning("Empty DataFrame passed to transformer.")
        return df, 0

    initial_count = len(df)
    logger.info("Starting cleaning for %d records. Columns: %s", initial_count, list(df.columns))

    # 1. Standardize column names (lowercase, alphanumeric + underscore)
    df = df.copy()
    df.columns = [
        re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
        for col in df.columns
    ]

    # 2. Whitespace trimming & null sentinels sanitization across string columns
    null_sentinels = {"nan", "nan", "none", "null", "n/a", "na", "", "nil"}
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].apply(lambda x: None if str(x).strip().lower() in null_sentinels else x)

    # 3. Column-specific transformations
    if "id" in df.columns:
        cleaned_id = normalize_numeric_series(df["id"])
        df["id"] = pd.to_numeric(cleaned_id, errors="coerce").astype("Int64")

    if "value" in df.columns:
        cleaned_val = normalize_numeric_series(df["value"])
        df["value"] = pd.to_numeric(cleaned_val, errors="coerce").astype("float64")

    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)

    if "updated_at" in df.columns:
        df["updated_at"] = pd.to_datetime(df["updated_at"], errors="coerce", utc=True)

    # 4. Deduplication
    dedup_cols = ["id"] if "id" in df.columns else list(df.columns)
    df_deduped = df.drop_duplicates(subset=dedup_cols, keep="last")
    duplicates_dropped = len(df) - len(df_deduped)

    # 5. Drop completely empty rows
    df_clean = df_deduped.dropna(how="all").copy()

    # 6. Append audit column
    df_clean["_etl_loaded_at"] = datetime.utcnow().isoformat()

    logger.info(
        "Cleaning finished: initial=%d, deduplicated=%d, duplicates_dropped=%d, final=%d",
        initial_count, len(df_deduped), duplicates_dropped, len(df_clean)
    )
    return df_clean, duplicates_dropped
