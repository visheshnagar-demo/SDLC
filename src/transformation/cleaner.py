"""Data cleaning and normalization module for sales order records."""
import logging
from datetime import datetime, timezone
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

NULL_SENTINELS = {"", "null", "none", "n/a", "nan", "nil", "undefined"}


class DataCleaner:
    """Cleans, sanitizes, and standardizes raw sales order DataFrames."""

    REQUIRED_COLUMNS = ["order_id"]

    @staticmethod
    def clean(df: pd.DataFrame, execution_time: datetime | None = None) -> pd.DataFrame:
        """Cleans and standardizes raw DataFrame columns according to schema specifications.

        Args:
            df: Raw input DataFrame from GCS
            execution_time: Optional datetime for ingested_at timestamp

        Returns:
            pd.DataFrame: Cleaned and normalized DataFrame
        """
        if df.empty:
            raise ValueError("Input DataFrame is empty.")

        clean_df = df.copy()

        # Check required columns
        for col in DataCleaner.REQUIRED_COLUMNS:
            if col not in clean_df.columns:
                raise ValueError(f"Missing required column in source data: '{col}'")

        # Strip whitespace and nullify sentinel strings across all object/string columns
        for col in clean_df.columns:
            if clean_df[col].dtype == object or isinstance(clean_df[col].dtype, pd.StringDtype):
                clean_df[col] = clean_df[col].apply(
                    lambda val: None if pd.isna(val) or (isinstance(val, str) and val.strip().lower() in NULL_SENTINELS)
                    else (val.strip() if isinstance(val, str) else val)
                )

        # Drop rows with null order_id
        clean_df = clean_df.dropna(subset=["order_id"])
        if clean_df.empty:
            raise ValueError("No valid records remaining after dropping null order_id values.")

        # Cast order_id to integer
        try:
            clean_df["order_id"] = clean_df["order_id"].astype(int)
        except Exception as exc:
            raise ValueError(f"Failed to cast order_id to integer: {exc}") from exc

        # Cast amount to float
        if "amount" in clean_df.columns:
            clean_df["amount"] = pd.to_numeric(clean_df["amount"], errors="coerce")

        # Standardize created_at and derive order_date
        current_utc = execution_time or datetime.now(timezone.utc)

        if "created_at" in clean_df.columns:
            clean_df["created_at"] = pd.to_datetime(clean_df["created_at"], utc=True, errors="coerce")
            # For records with valid created_at, derive order_date; otherwise default to current UTC date
            clean_df["order_date"] = clean_df["created_at"].dt.date
            clean_df["order_date"] = clean_df["order_date"].fillna(current_utc.date())
        else:
            clean_df["created_at"] = pd.NaT
            clean_df["order_date"] = current_utc.date()

        # Add ingested_at audit column
        clean_df["ingested_at"] = current_utc

        # Format string columns safely
        string_cols = ["customer_id", "customer_name", "customer_email", "product_category", "currency", "order_status"]
        for col in string_cols:
            if col in clean_df.columns:
                clean_df[col] = clean_df[col].astype(object).where(clean_df[col].notnull(), None)
            else:
                clean_df[col] = None

        logger.info("Data cleaning complete. Output rows: %d", len(clean_df))
        return clean_df
