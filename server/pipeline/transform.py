"""Data Transformation and Schema-on-Read Normalization Module."""

import re
from datetime import datetime, timezone
from typing import Any, Optional, Union
from server.pipeline.observability import structured_logger

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

COLUMN_MAP = {
    "rank": "rank",
    "peak": "peak",
    "all time peak": "all_time_peak",
    "actual gross": "actual_gross",
    "adjusted gross (in 2022 dollars)": "adjusted_gross_in_2022_dollars",
    "adjusted gross in 2022 dollars": "adjusted_gross_in_2022_dollars",
    "artist": "artist",
    "tour title": "tour_title",
    "year(s)": "years",
    "years": "years",
    "year s": "years",
    "shows": "shows",
    "average gross": "average_gross",
    "ref.": "ref",
    "ref": "ref",
}

NULL_STRINGS = {"", "nan", "null", "none", "n/a", "na", "<na>"}


def sanitize_column_name(raw_name: str) -> str:
    """Sanitize raw column header to standard BigQuery-compatible snake_case name."""
    normalized = str(raw_name).replace("\u00a0", " ").strip().lower()
    if normalized in COLUMN_MAP:
        return COLUMN_MAP[normalized]

    cleaned = re.sub(r"[^\w\s]", "", normalized)
    cleaned = re.sub(r"\s+", "_", cleaned).strip("_")
    if cleaned in COLUMN_MAP:
        return COLUMN_MAP[cleaned]

    return cleaned or "col"


def _clean_str_value(val: Any) -> Optional[str]:
    """Clean string values and normalize null representations."""
    if val is None:
        return None
    if HAS_PANDAS and pd is not None and pd.isna(val):
        return None
    val_str = str(val).replace("\u00a0", " ").strip()
    if val_str.lower() in NULL_STRINGS:
        return None
    return val_str


def _clean_int_value(val: Any) -> Optional[int]:
    """Clean integer values removing commas and formatting."""
    clean_s = _clean_str_value(val)
    if clean_s is None:
        return None
    numeric_s = re.sub(r"[^\d\-]", "", clean_s)
    if not numeric_s:
        return None
    try:
        return int(numeric_s)
    except (ValueError, TypeError):
        return None


def transform_data(
    data: Any,
    max_error_ratio: float = 0.0,
) -> Any:
    """
    Transforms and sanitizes the raw records/dataframe into the target BigQuery schema.

    Args:
        data: pd.DataFrame or list of row dicts from extractor.
        max_error_ratio: Circuit breaker threshold (0.0 means 0 tolerance).

    Returns:
        Transformed pd.DataFrame or list of dicts with normalized columns and types.

    Raises:
        RuntimeError: If data is empty or circuit breaker is triggered.
    """
    total_input = len(data) if data is not None else 0
    structured_logger.info("Starting data transformation", {"input_rows": total_input})

    if data is None or total_input == 0:
        error_msg = "Transformation failed: input data contains 0 records."
        structured_logger.error(error_msg)
        raise RuntimeError(error_msg)

    now_utc_str = datetime.now(timezone.utc).isoformat()

    if HAS_PANDAS and pd is not None and isinstance(data, pd.DataFrame):
        renamed_cols = {col: sanitize_column_name(col) for col in data.columns}
        df = data.rename(columns=renamed_cols).copy()

        target_columns = [
            "rank",
            "peak",
            "all_time_peak",
            "actual_gross",
            "adjusted_gross_in_2022_dollars",
            "artist",
            "tour_title",
            "years",
            "shows",
            "average_gross",
            "ref",
        ]

        for col in target_columns:
            if col not in df.columns:
                df[col] = None

        df["rank"] = df["rank"].apply(_clean_int_value).astype("Int64")
        df["shows"] = df["shows"].apply(_clean_int_value).astype("Int64")

        str_cols = [
            "peak",
            "all_time_peak",
            "actual_gross",
            "adjusted_gross_in_2022_dollars",
            "artist",
            "tour_title",
            "years",
            "average_gross",
            "ref",
        ]
        for col in str_cols:
            df[col] = df[col].apply(_clean_str_value).astype(object)

        df["_etl_loaded_at"] = pd.Timestamp.now(tz="UTC")
        transformed_df = df[target_columns + ["_etl_loaded_at"]]

        corrupted = transformed_df["artist"].isna() & transformed_df["tour_title"].isna()
        corrupted_count = int(corrupted.sum())
        error_ratio = corrupted_count / len(transformed_df) if len(transformed_df) > 0 else 1.0

        if error_ratio > max_error_ratio:
            error_msg = f"Circuit breaker triggered: Corrupted row ratio {error_ratio:.2%} exceeded {max_error_ratio:.2%}."
            structured_logger.error(error_msg)
            raise RuntimeError(error_msg)

        return transformed_df
    else:
        # Fallback list of dicts transformation
        transformed_rows = []
        corrupted_count = 0

        for row in data:
            sanitized_row: dict[str, Any] = {}
            for k, v in row.items():
                clean_key = sanitize_column_name(k)
                sanitized_row[clean_key] = v

            record = {
                "rank": _clean_int_value(sanitized_row.get("rank")),
                "peak": _clean_str_value(sanitized_row.get("peak")),
                "all_time_peak": _clean_str_value(sanitized_row.get("all_time_peak")),
                "actual_gross": _clean_str_value(sanitized_row.get("actual_gross")),
                "adjusted_gross_in_2022_dollars": _clean_str_value(sanitized_row.get("adjusted_gross_in_2022_dollars")),
                "artist": _clean_str_value(sanitized_row.get("artist")),
                "tour_title": _clean_str_value(sanitized_row.get("tour_title")),
                "years": _clean_str_value(sanitized_row.get("years")),
                "shows": _clean_int_value(sanitized_row.get("shows")),
                "average_gross": _clean_str_value(sanitized_row.get("average_gross")),
                "ref": _clean_str_value(sanitized_row.get("ref")),
                "_etl_loaded_at": now_utc_str,
            }

            if record["artist"] is None and record["tour_title"] is None:
                corrupted_count += 1

            transformed_rows.append(record)

        total_rows = len(transformed_rows)
        error_ratio = corrupted_count / total_rows if total_rows > 0 else 1.0

        if error_ratio > max_error_ratio:
            error_msg = f"Circuit breaker triggered: Corrupted row ratio {error_ratio:.2%} exceeded {max_error_ratio:.2%}."
            structured_logger.error(error_msg)
            raise RuntimeError(error_msg)

        return transformed_rows
