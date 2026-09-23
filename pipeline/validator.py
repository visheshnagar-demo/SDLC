"""Pipeline Validator Module.

Provides schema validation, circuit breakers, and data quality assertions.
Supports both pandas DataFrames and native Python dict lists.
"""
from typing import Tuple, List, Union, Dict, Any
from pipeline.logger import get_logger

try:
    import pandas as pd
except ImportError:
    pd = None

logger = get_logger("sales_etl.validator")

REQUIRED_COLUMNS = [
    "order_id",
    "customer_id",
    "customer_name",
    "customer_email",
    "product_category",
    "amount",
    "currency",
    "order_status",
    "created_at",
]


class DataValidator:
    """Validates input datasets against schema and quality rules."""

    def __init__(self, required_columns: List[str] = None):
        self.required_columns = required_columns or REQUIRED_COLUMNS

    def validate(
        self, data: Union[Any, List[Dict[str, Any]]]
    ) -> Tuple[Union[Any, List[Dict[str, Any]]], Union[Any, List[Dict[str, Any]]]]:
        """Validates raw dataset, splitting valid rows and quarantined rows."""
        if data is None:
            raise ValueError("FATAL: Input data is empty or None.")

        if pd is not None and isinstance(data, pd.DataFrame):
            if data.empty:
                raise ValueError("FATAL: Input DataFrame is empty.")

            df = data.copy()
            col_map = {col: str(col).strip().lower() for col in df.columns}
            df = df.rename(columns=col_map)

            for col in self.required_columns:
                if col not in df.columns:
                    df[col] = None

            raw_count = len(df)
            is_all_null = df[self.required_columns].isna().all(axis=1)
            is_missing_key = df["order_id"].isna() | (
                df["order_id"].astype(str).str.strip() == ""
            )

            quarantine_mask = is_all_null | is_missing_key
            valid_df = df[~quarantine_mask].copy()
            quarantined_df = df[quarantine_mask].copy()

            if raw_count > 0 and len(valid_df) == 0:
                raise ValueError(
                    f"FATAL: 100% of raw records ({raw_count}) were quarantined during validation. Circuit breaker tripped."
                )

            return valid_df, quarantined_df

        # Native Python list of dicts fallback
        if isinstance(data, list):
            if len(data) == 0:
                raise ValueError("FATAL: Input data list is empty.")

            raw_count = len(data)
            valid_rows = []
            quarantined_rows = []

            for row in data:
                normalized_row = {
                    str(k).strip().lower(): v for k, v in row.items()
                }
                for col in self.required_columns:
                    if col not in normalized_row:
                        normalized_row[col] = None

                order_id = normalized_row.get("order_id")
                is_missing_key = order_id is None or str(order_id).strip() == "" or str(order_id).strip().lower() in ("none", "nan", "null")
                is_all_null = all(
                    normalized_row.get(col) is None or str(normalized_row.get(col)).strip() == ""
                    for col in self.required_columns
                )

                if is_missing_key or is_all_null:
                    quarantined_rows.append(normalized_row)
                else:
                    valid_rows.append(normalized_row)

            if raw_count > 0 and len(valid_rows) == 0:
                raise ValueError(
                    f"FATAL: 100% of raw records ({raw_count}) were quarantined during validation. Circuit breaker tripped."
                )

            return valid_rows, quarantined_rows

        raise TypeError(f"Unsupported data format: {type(data)}")
