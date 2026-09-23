"""Data transformation, cleansing, and record deduplication engine."""
from datetime import datetime, timezone
from typing import Tuple
import numpy as np
import pandas as pd
from server.logger import logger


class DataTransformer:
    """Performs data cleaning, standardization, deduplication, and audit column enrichment."""

    def __init__(self, batch_id: str, source_uri: str):
        self.batch_id = batch_id
        self.source_uri = source_uri

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """Cleans, coerces, deduplicates, and enriches sales records.

        Returns:
            Tuple of (transformed_df, duplicates_removed_count)
        """
        if df.empty:
            return df.copy(), 0

        clean_df = df.copy()

        # 1. Strip whitespace and normalize empty/sentinel strings to None
        for col in clean_df.columns:
            if clean_df[col].dtype == object or pd.api.types.is_string_dtype(clean_df[col]):
                clean_df[col] = clean_df[col].astype(str).str.strip()
                clean_df[col] = clean_df[col].replace(
                    {"nan": None, "None": None, "null": None, "NULL": None, "": None}
                )

        # 2. Type conversions
        # order_id -> integer
        clean_df["order_id"] = pd.to_numeric(clean_df["order_id"], errors="coerce").astype("Int64")

        # amount -> float
        if "amount" in clean_df.columns:
            clean_df["amount"] = (
                clean_df["amount"]
                .astype(str)
                .str.replace(r"[,$€£¥\s]", "", regex=True)
                .replace({"None": np.nan, "nan": np.nan, "": np.nan})
            )
            clean_df["amount"] = pd.to_numeric(clean_df["amount"], errors="coerce")

        # created_at -> datetime with UTC timezone
        if "created_at" in clean_df.columns:
            clean_df["created_at"] = pd.to_datetime(clean_df["created_at"], errors="coerce", utc=True)

        # email normalization
        if "customer_email" in clean_df.columns:
            clean_df["customer_email"] = clean_df["customer_email"].astype(str).str.lower().str.strip()
            clean_df["customer_email"] = clean_df["customer_email"].replace(
                {"none": None, "nan": None, "null": None, "": None}
            )

        # uppercase codes
        for code_col in ["currency", "order_status"]:
            if code_col in clean_df.columns:
                clean_df[code_col] = clean_df[code_col].astype(str).str.upper().str.strip()
                clean_df[code_col] = clean_df[code_col].replace(
                    {"NONE": None, "NAN": None, "NULL": None, "": None}
                )

        # 3. Deduplication: sort by created_at desc, drop duplicates on order_id
        initial_len = len(clean_df)
        if "created_at" in clean_df.columns:
            clean_df = clean_df.sort_values(by="created_at", ascending=False, na_position="last")

        clean_df = clean_df.drop_duplicates(subset=["order_id"], keep="first").copy()
        duplicates_removed = initial_len - len(clean_df)
        logger.info("Deduplication: removed %d duplicate rows by order_id", duplicates_removed)

        # 4. Attach audit columns
        ingested_at = datetime.now(timezone.utc)
        clean_df["_etl_ingested_at"] = pd.to_datetime(ingested_at)
        clean_df["_etl_batch_id"] = self.batch_id
        clean_df["_etl_source_file"] = self.source_uri

        # Final reordering / formatting
        return clean_df, duplicates_removed
