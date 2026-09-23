"""Transformer module for data cleaning, sanitization, and normalization."""
import logging

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)


class DataTransformer:
    """Cleans and standardizes raw DataFrames."""

    def clean_data(self, df):
        """Applies data cleaning rules:
        1. Whitespace trimming and string null normalization.
        2. Date / Timestamp normalization to UTC.
        3. Numeric conversion and validation.
        4. Deduplication.
        5. Ingestion timestamp attachment.
        """
        if pd is None:
            raise RuntimeError("pandas is required for transformation.")
        if df.empty:
            return df

        cleaned = df.copy()

        # 1. String whitespace trimming and null normalization
        for col in cleaned.select_dtypes(include=["object", "string"]).columns:
            cleaned[col] = cleaned[col].astype(str).str.strip()
            cleaned[col] = cleaned[col].replace({
                "nan": None,
                "None": None,
                "NULL": None,
                "null": None,
                "N/A": None,
                "": None
            })

        # 2. Date / Timestamp normalization
        for col in cleaned.columns:
            if "date" in col.lower() or "time" in col.lower() or "created" in col.lower() or "updated" in col.lower():
                cleaned[col] = pd.to_datetime(cleaned[col], utc=True, errors="coerce")

        # 3. Numeric conversions
        for col in ["value", "amount", "price", "count", "quantity"]:
            if col in cleaned.columns:
                cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")

        # 4. Deduplication
        if "id" in cleaned.columns:
            cleaned = cleaned.drop_duplicates(subset=["id"], keep="last")
        else:
            cleaned = cleaned.drop_duplicates(keep="last")

        # 5. Non-null row filter
        cleaned = cleaned.dropna(how="all")

        # 6. Audit timestamp
        cleaned["ingested_at"] = pd.Timestamp.utcnow()

        return cleaned
