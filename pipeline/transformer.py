"""Transformation and sanitization module for Tour Record dataset."""

from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, Optional, Tuple

try:
    import numpy as np
    import pandas as pd
except ImportError:
    np = None
    pd = None

from pipeline.circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)


def sanitize_column_name(col: str) -> str:
    """Normalizes header string to clean BigQuery identifier."""
    cleaned = col.replace("\u00a0", " ").strip()
    cleaned = re.sub(r"\(in \d+ dollars\)", "in 2022 dollars", cleaned)
    cleaned = re.sub(r"[^\w\s]", "", cleaned)
    cleaned = re.sub(r"\s+", "_", cleaned)
    return cleaned.lower()


def clean_int_value(val: Any) -> Optional[int]:
    """Cleans currency, commas, and footnote annotations to extract integer value."""
    if val is None:
        return None
    if pd is not None and pd.isna(val):
        return None
    val_str = str(val).replace("\u00a0", " ").strip()
    if val_str == "" or val_str.lower() in ("n/a", "null", "none", "nan", "-"):
        return None

    # Remove footnote markers like [1], [4][a]
    val_str = re.sub(r"\[.*?\]", "", val_str)
    # Remove currency symbols, commas, and dagger symbols
    val_str = re.sub(r"[\$,\s\u2020\u2021\u2022]", "", val_str)
    # Extract leading digits or valid integer
    match = re.search(r"^-?\d+", val_str)
    if match:
        try:
            return int(match.group(0))
        except (ValueError, TypeError):
            return None
    return None


def clean_string_value(val: Any) -> Optional[str]:
    """Cleans string, removes excessive whitespace and treats null tokens as None."""
    if val is None:
        return None
    if pd is not None and pd.isna(val):
        return None
    val_str = str(val).replace("\u00a0", " ").strip()
    if val_str == "" or val_str.lower() in ("n/a", "null", "none", "nan"):
        return None
    return val_str


class DataTransformer:
    """Transforms raw tour CSV data into validated, typed BigQuery-ready DataFrames."""

    def __init__(
        self,
        circuit_breaker: Optional[CircuitBreaker] = None,
        error_threshold_ratio: float = 0.05,
    ) -> None:
        self.circuit_breaker = circuit_breaker or CircuitBreaker(max_error_rate=error_threshold_ratio)
        self.metrics: Dict[str, int] = {
            "source_row_count": 0,
            "cleaned_row_count": 0,
            "quarantined_row_count": 0,
            "dropped_row_count": 0,
        }

    def transform(
        self,
        raw_df: Any,
        source_file: str = "gs://sdlc-workspec-store/etl/data/my_file (1).csv",
    ) -> Any:
        """Sanitizes, coerces types, and validates the raw DataFrame."""
        if pd is None:
            raise RuntimeError("pandas is required for DataTransformer.")

        source_count = len(raw_df) if hasattr(raw_df, "__len__") else 0
        logger.info("Starting transformation on %d raw rows", source_count)
        self.circuit_breaker.set_total_extracted(source_count)
        self.metrics["source_row_count"] = source_count

        expected_columns = [
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
            "_etl_loaded_at",
            "_source_file",
        ]

        if hasattr(raw_df, "empty") and raw_df.empty:
            empty_df = pd.DataFrame(columns=expected_columns)
            self.metrics["cleaned_row_count"] = 0
            self.metrics["quarantined_row_count"] = 0
            self.metrics["dropped_row_count"] = 0
            return empty_df

        # Map normalized column names
        header_map = {}
        for col in raw_df.columns:
            sanitized = sanitize_column_name(str(col))
            header_map[col] = sanitized

        renamed_df = raw_df.rename(columns=header_map)

        # Standard canonical column mapping
        canonical_map = {
            "rank": "rank",
            "peak": "peak",
            "all_time_peak": "all_time_peak",
            "actual_gross": "actual_gross",
            "adjusted_gross_in_2022_dollars": "adjusted_gross_in_2022_dollars",
            "artist": "artist",
            "tour_title": "tour_title",
            "years": "years",
            "year_s": "years",
            "years_": "years",
            "shows": "shows",
            "average_gross": "average_gross",
            "ref": "ref",
            "ref_": "ref",
        }

        # Rename to canonical names
        renamed_df = renamed_df.rename(columns={k: v for k, v in canonical_map.items() if k in renamed_df.columns})

        cleaned_records = []
        load_timestamp = pd.Timestamp(datetime.now(timezone.utc))

        for idx, row in renamed_df.iterrows():
            # Validate critical field (e.g. rank or artist must exist)
            rank_val = clean_int_value(row.get("rank"))
            artist_val = clean_string_value(row.get("artist"))

            if rank_val is None and artist_val is None:
                self.circuit_breaker.record_quarantine(
                    row_index=int(idx),
                    raw_record=row.to_dict(),
                    reason="Missing both rank and artist identifiers",
                )
                continue

            record = {
                "rank": rank_val,
                "peak": clean_int_value(row.get("peak")),
                "all_time_peak": clean_int_value(row.get("all_time_peak")),
                "actual_gross": clean_int_value(row.get("actual_gross")),
                "adjusted_gross_in_2022_dollars": clean_int_value(row.get("adjusted_gross_in_2022_dollars")),
                "artist": artist_val,
                "tour_title": clean_string_value(row.get("tour_title")),
                "years": clean_string_value(row.get("years")),
                "shows": clean_int_value(row.get("shows")),
                "average_gross": clean_int_value(row.get("average_gross")),
                "ref": clean_string_value(row.get("ref")),
                "_etl_loaded_at": load_timestamp,
                "_source_file": source_file,
            }
            cleaned_records.append(record)
            self.circuit_breaker.record_success()

        self.circuit_breaker.verify_error_rate()

        result_df = pd.DataFrame(cleaned_records, columns=expected_columns)

        # Enforce exact BigQuery nullable types
        int_cols = [
            "rank",
            "peak",
            "all_time_peak",
            "actual_gross",
            "adjusted_gross_in_2022_dollars",
            "shows",
            "average_gross",
        ]
        for col in int_cols:
            if col in result_df.columns:
                result_df[col] = result_df[col].astype("Int64")

        str_cols = ["artist", "tour_title", "years", "ref", "_source_file"]
        for col in str_cols:
            if col in result_df.columns:
                result_df[col] = result_df[col].astype("string")

        if "_etl_loaded_at" in result_df.columns:
            result_df["_etl_loaded_at"] = pd.to_datetime(result_df["_etl_loaded_at"], utc=True)

        self.metrics["cleaned_row_count"] = len(result_df)
        self.metrics["quarantined_row_count"] = self.circuit_breaker.rows_quarantined
        self.metrics["dropped_row_count"] = self.circuit_breaker.rows_quarantined

        logger.info(
            "Transformation complete. Cleaned: %d, Quarantined: %d",
            len(result_df),
            self.circuit_breaker.rows_quarantined,
        )
        return result_df
