"""Deduplication module for Sales Order ETL."""
import logging

logger = logging.getLogger(__name__)

def deduplicate_sales_data(df, primary_key: str = "order_id", timestamp_col: str = "created_at"):
    """Deduplicates records based on primary key, retaining the record with latest timestamp."""
    import pandas as pd

    if df.empty or primary_key not in df.columns:
        return df

    initial_count = len(df)
    if timestamp_col in df.columns:
        sorted_df = df.sort_values(by=[primary_key, timestamp_col], ascending=[True, True])
        deduped = sorted_df.drop_duplicates(subset=[primary_key], keep="last").copy()
    else:
        deduped = df.drop_duplicates(subset=[primary_key], keep="last").copy()

    removed = initial_count - len(deduped)
    logger.info("Deduplication complete. Initial: %d, Deduplicated: %d, Removed: %d", initial_count, len(deduped), removed)
    return deduped
