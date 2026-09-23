"""Pipeline Deduplicator Module.

Removes duplicate sales records based on primary business identifier.
Supports both pandas DataFrames and native Python dict lists.
"""
from typing import Tuple, Union, List, Dict, Any
from pipeline.logger import get_logger

try:
    import pandas as pd
except ImportError:
    pd = None

logger = get_logger("sales_etl.deduplicator")


class RecordDeduplicator:
    """Deduplicates sales order records by primary key."""

    def __init__(self, key_cols: list = None):
        self.key_cols = key_cols or ["order_id"]

    def deduplicate(
        self, data: Union[Any, List[Dict[str, Any]]]
    ) -> Tuple[Union[Any, List[Dict[str, Any]]], int]:
        """Deduplicates records on key_cols, retaining the latest entry."""
        if data is None:
            return ([] if pd is None or not isinstance(data, pd.DataFrame) else pd.DataFrame()), 0

        # Handle Pandas DataFrame
        if pd is not None and isinstance(data, pd.DataFrame):
            if data.empty:
                return pd.DataFrame(), 0

            initial_count = len(data)
            valid_keys = [k for k in self.key_cols if k in data.columns]
            if not valid_keys:
                return data, 0

            df_sorted = (
                data.sort_values(by="created_at", ascending=True)
                if "created_at" in data.columns
                else data
            )

            dedup_df = df_sorted.drop_duplicates(subset=valid_keys, keep="last").copy()
            duplicates_removed = initial_count - len(dedup_df)

            logger.info(
                "Deduplication complete: %d records in, %d out (%d removed)",
                initial_count,
                len(dedup_df),
                duplicates_removed,
            )

            return dedup_df, duplicates_removed

        # Handle native Python list of dicts
        if isinstance(data, list):
            if len(data) == 0:
                return [], 0

            initial_count = len(data)
            seen_keys = {}

            for row in data:
                key_tuple = tuple(row.get(k) for k in self.key_cols)
                seen_keys[key_tuple] = row  # Overwrites earlier with later row

            dedup_rows = list(seen_keys.values())
            duplicates_removed = initial_count - len(dedup_rows)

            logger.info(
                "Deduplication complete: %d records in, %d out (%d removed)",
                initial_count,
                len(dedup_rows),
                duplicates_removed,
            )

            return dedup_rows, duplicates_removed

        raise TypeError(f"Unsupported data format: {type(data)}")
