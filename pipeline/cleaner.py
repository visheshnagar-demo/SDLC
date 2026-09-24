import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import pandas as pd
    import numpy as np
except ImportError:
    pd = None
    np = None

from pipeline.logger import get_logger

logger = get_logger("cleaner")

NULL_EQUIVALENTS = {
    "null",
    "none",
    "nan",
    "n/a",
    "na",
    "",
    "<null>",
    "undefined",
}


def clean_records(
    records: List[Dict[str, Any]],
    primary_key: Optional[str] = "id",
    add_audit_column: bool = True,
) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """Cleans a list of dictionary records:

    1. Standardizes keys (lowercase, stripped).
    2. Strips whitespace on string values.
    3. Normalizes null representations (empty strings, 'NULL', 'N/A', etc.) to None.
    4. Deduplicates records based on primary key identifier (keeping latest).
    5. Appends metadata audit timestamp `_etl_loaded_at`.

    Returns:
        Tuple of (cleaned_records, metrics_dict)
    """
    raw_count = len(records)
    if raw_count == 0:
        return [], {
            "extracted_rows": 0,
            "cleaned_rows": 0,
            "dropped_duplicates": 0,
        }

    now_utc_str = datetime.now(timezone.utc).isoformat()
    cleaned_list: List[Dict[str, Any]] = []
    seen_indices: Dict[Any, int] = {}

    for row in records:
        cleaned_row: Dict[str, Any] = {}
        for k, v in row.items():
            norm_key = str(k).strip().lower()
            if isinstance(v, str):
                v_stripped = v.strip()
                if v_stripped.lower() in NULL_EQUIVALENTS:
                    cleaned_row[norm_key] = None
                else:
                    cleaned_row[norm_key] = v_stripped
            elif v is None:
                cleaned_row[norm_key] = None
            elif np is not None and isinstance(v, float) and np.isnan(v):
                cleaned_row[norm_key] = None
            else:
                cleaned_row[norm_key] = v

        if add_audit_column:
            cleaned_row["_etl_loaded_at"] = now_utc_str

        pk_col = primary_key.lower() if primary_key else None
        pk_val = cleaned_row.get(pk_col) if pk_col else None

        if pk_val is not None:
            if pk_val in seen_indices:
                prev_idx = seen_indices[pk_val]
                cleaned_list[prev_idx] = cleaned_row
            else:
                seen_indices[pk_val] = len(cleaned_list)
                cleaned_list.append(cleaned_row)
        else:
            cleaned_list.append(cleaned_row)

    cleaned_final = [r for r in cleaned_list if r is not None]
    dropped_dupes = raw_count - len(cleaned_final)

    metrics = {
        "extracted_rows": raw_count,
        "cleaned_rows": len(cleaned_final),
        "dropped_duplicates": dropped_dupes,
    }

    logger.info(
        f"Data cleaning complete: {raw_count} raw rows -> {len(cleaned_final)} cleaned rows ({dropped_dupes} duplicates removed)."
    )
    return cleaned_final, metrics


def clean_dataframe(
    df: Any,
    primary_key: Optional[str] = "id",
    add_audit_column: bool = True,
) -> Tuple[Any, Dict[str, int]]:
    """Cleans raw extracted DataFrame or list of records.

    Returns:
        Tuple of (cleaned_data, metrics_dict)
    """
    if df is None:
        raise ValueError("Input data cannot be None.")

    if pd is not None and isinstance(df, pd.DataFrame):
        records = df.to_dict(orient="records")
        cleaned_records, metrics = clean_records(records, primary_key=primary_key, add_audit_column=add_audit_column)
        if len(cleaned_records) == 0:
            cols = [str(c).strip().lower() for c in df.columns]
            if add_audit_column and "_etl_loaded_at" not in cols:
                cols.append("_etl_loaded_at")
            cleaned_df = pd.DataFrame(columns=cols)
            return cleaned_df, metrics
        cleaned_df = pd.DataFrame(cleaned_records)
        return cleaned_df, metrics
    elif isinstance(df, list):
        return clean_records(df, primary_key=primary_key, add_audit_column=add_audit_column)
    elif hasattr(df, "to_dict"):
        records = df.to_dict(orient="records")
        cleaned_records, metrics = clean_records(records, primary_key=primary_key, add_audit_column=add_audit_column)
        return cleaned_records, metrics
    else:
        raise TypeError(f"Unsupported data type for cleaning: {type(df)}")
