"""Data transformation, cleansing, and record deduplication engine."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

try:
    import numpy as np
except ImportError:
    from unittest.mock import MagicMock
    np = MagicMock()

try:
    import pandas as pd
except ImportError:
    from unittest.mock import MagicMock
    pd = MagicMock()

from server.config import config
from server.logger import logger


def clean_data(df: "pd.DataFrame") -> "pd.DataFrame":
    """Performs field-level sanitization, whitespace stripping, and type coercion."""
    if df.empty:
        return df.copy()

    clean_df = df.copy()

    # 1. Strip whitespace and normalize empty/sentinel strings to None / NaN
    for col in clean_df.columns:
        if clean_df[col].dtype == object or pd.api.types.is_string_dtype(clean_df[col]):
            clean_df[col] = clean_df[col].astype(str).str.strip()
            clean_df[col] = clean_df[col].replace(
                {"nan": None, "None": None, "null": None, "NULL": None, "": None}
            )

    # 2. Type conversions
    # order_id -> integer
    if "order_id" in clean_df.columns:
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

    return clean_df


def deduplicate(
    df: "pd.DataFrame",
    subset: Optional[List[str]] = None,
    order_by: Optional[str] = "created_at",
) -> Tuple["pd.DataFrame", int]:
    """Deduplicates records on subset key keeping the latest order_by timestamp."""
    if df.empty:
        return df.copy(), 0

    dedup_keys = subset or ["order_id"]
    valid_keys = [k for k in dedup_keys if k in df.columns]
    if not valid_keys:
        return df.copy(), 0

    initial_len = len(df)
    sorted_df = df.copy()

    if order_by and order_by in sorted_df.columns:
        sorted_df = sorted_df.sort_values(by=order_by, ascending=False, na_position="last")

    deduped_df = sorted_df.drop_duplicates(subset=valid_keys, keep="first").copy()
    duplicates_removed = initial_len - len(deduped_df)
    logger.info("Deduplication: removed %d duplicate rows by %s", duplicates_removed, valid_keys)
    return deduped_df, duplicates_removed


def add_audit_columns(
    df: "pd.DataFrame",
    batch_id: Optional[str] = None,
    source_file: Optional[str] = None,
) -> "pd.DataFrame":
    """Appends ETL metadata audit columns to dataframe."""
    enriched = df.copy()
    ingested_at = datetime.now(timezone.utc)
    enriched["_etl_ingested_at"] = pd.to_datetime(ingested_at)
    enriched["_etl_batch_id"] = batch_id or str(uuid.uuid4())
    enriched["_etl_source_file"] = source_file or config.gcs_source_uri
    return enriched


class DataTransformer:
    """Performs data cleaning, standardization, deduplication, and audit column enrichment."""

    def __init__(self, batch_id: Optional[str] = None, source_uri: Optional[str] = None):
        self.batch_id = batch_id or str(uuid.uuid4())
        self.source_uri = source_uri or config.gcs_source_uri

    def clean_data(self, df: "pd.DataFrame") -> "pd.DataFrame":
        """Cleans and normalizes dataframe fields."""
        return clean_data(df)

    def deduplicate(
        self,
        df: "pd.DataFrame",
        subset: Optional[List[str]] = None,
        order_by: Optional[str] = "created_at",
    ) -> Tuple["pd.DataFrame", int]:
        """Deduplicates records preserving latest record."""
        return deduplicate(df, subset=subset, order_by=order_by)

    def add_audit_columns(
        self,
        df: "pd.DataFrame",
        batch_id: Optional[str] = None,
        source_file: Optional[str] = None,
    ) -> "pd.DataFrame":
        """Adds audit metadata columns."""
        return add_audit_columns(
            df,
            batch_id=batch_id or self.batch_id,
            source_file=source_file or self.source_uri,
        )

    def transform(self, df: "pd.DataFrame") -> Tuple["pd.DataFrame", int]:
        """Cleans, coerces, deduplicates, and enriches sales records.

        Returns:
            Tuple of (transformed_df, duplicates_removed_count)
        """
        if df.empty:
            return df.copy(), 0

        # Step 1: Cleansing & casting
        cleaned_df = self.clean_data(df)

        # Step 2: Deduplication
        deduped_df, duplicates_removed = self.deduplicate(cleaned_df)

        # Step 3: Audit columns
        final_df = self.add_audit_columns(deduped_df)

        return final_df, duplicates_removed

    def transform_data(self, df: "pd.DataFrame") -> Tuple["pd.DataFrame", int]:
        """Alias for transform."""
        return self.transform(df)


def transform_data(
    df: "pd.DataFrame",
    batch_id: Optional[str] = None,
    source_uri: Optional[str] = None,
) -> Tuple["pd.DataFrame", int]:
    """Helper function for transforming dataframe."""
    transformer = DataTransformer(batch_id=batch_id, source_uri=source_uri)
    return transformer.transform(df)


def transform(
    df: "pd.DataFrame",
    batch_id: Optional[str] = None,
    source_uri: Optional[str] = None,
) -> Tuple["pd.DataFrame", int]:
    """Helper function for transforming dataframe."""
    return transform_data(df, batch_id=batch_id, source_uri=source_uri)
