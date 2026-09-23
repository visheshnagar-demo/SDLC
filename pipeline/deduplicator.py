"""Deduplication engine for sales order records."""
from typing import List, Tuple
import pandas as pd
from pipeline.logger import get_logger

logger = get_logger("deduplicator")


class Deduplicator:
    """Removes duplicate sales orders based on business keys."""

    def __init__(self, key_columns: List[str] = None):
        self.key_columns = key_columns or ["order_id"]

    def deduplicate(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """Deduplicates records based on the business key, retaining the latest record.

        Returns:
            Tuple of (deduplicated DataFrame, count of dropped duplicates)
        """
        if df.empty:
            return df.copy(), 0

        initial_count = len(df)
        
        # Sort by created_at if available so we keep the latest record
        if "created_at" in df.columns:
            df_sorted = df.sort_values(by="created_at", ascending=True)
        else:
            df_sorted = df

        df_deduped = df_sorted.drop_duplicates(subset=self.key_columns, keep="last")
        deduped_count = initial_count - len(df_deduped)

        logger.info(
            f"Deduplication completed: {initial_count} initial records -> {len(df_deduped)} unique records ({deduped_count} duplicates removed)."
        )
        return df_deduped, deduped_count
