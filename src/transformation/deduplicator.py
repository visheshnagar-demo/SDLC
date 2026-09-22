"""Deduplication module for sales order records."""
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class Deduplicator:
    """Deduplicates records based on primary business keys."""

    @staticmethod
    def deduplicate(df: pd.DataFrame, key_column: str = "order_id") -> pd.DataFrame:
        """Deduplicates DataFrame records based on primary key.

        Prioritizes the latest record by 'created_at' and the record with fewer nulls.

        Args:
            df: Cleaned input DataFrame
            key_column: Primary business key (default: 'order_id')

        Returns:
            pd.DataFrame: Deduplicated DataFrame
        """
        if df.empty:
            return df

        if key_column not in df.columns:
            raise ValueError(f"Key column '{key_column}' not found in DataFrame for deduplication.")

        initial_count = len(df)

        # Create temporary metric for null counts to pick the most complete row in ties
        df_copy = df.copy()
        df_copy["_null_count"] = df_copy.isnull().sum(axis=1)

        # Sort: first by key_column, then by created_at DESC, then by _null_count ASC
        sort_cols = [key_column]
        ascending = [True]

        if "created_at" in df_copy.columns:
            sort_cols.append("created_at")
            ascending.append(False)

        sort_cols.append("_null_count")
        ascending.append(True)

        deduped = df_copy.sort_values(by=sort_cols, ascending=ascending)
        deduped = deduped.drop_duplicates(subset=[key_column], keep="first")
        deduped = deduped.drop(columns=["_null_count"])

        final_count = len(deduped)
        duplicates_removed = initial_count - final_count

        logger.info(
            "Deduplication finished on '%s'. Initial: %d, Deduplicated: %d, Removed: %d",
            key_column,
            initial_count,
            final_count,
            duplicates_removed,
        )

        return deduped
