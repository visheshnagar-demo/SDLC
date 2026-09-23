"""Data transformation and cleaning module for sales order records."""
from datetime import datetime, timezone
import pandas as pd
from pipeline.logger import get_logger

logger = get_logger("transformer")


class DataTransformer:
    """Cleans, casts, and standardizes sales order datasets."""

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies comprehensive data cleaning and type transformations.

        1. Whitespace trimming across all string attributes.
        2. Standardizing null placeholders ('nan', 'null', 'None', '').
        3. Integer conversion for order_id.
        4. Float conversion for amount.
        5. Timestamp parsing and UTC normalization for created_at.
        6. Adding ingested_at pipeline execution timestamp.
        """
        if df.empty:
            logger.warning("Empty DataFrame passed to transformer.")
            return df.copy()

        df_transformed = df.copy()

        # 1. Clean column names
        df_transformed.columns = [str(c).strip().lower() for c in df_transformed.columns]

        # 2. String trimming & Null standardization
        for col in df_transformed.select_dtypes(include=["object", "string"]).columns:
            df_transformed[col] = df_transformed[col].astype(str).str.strip()
            df_transformed[col] = df_transformed[col].replace(
                {"nan": None, "None": None, "null": None, "NULL": None, "": None}
            )

        # 3. Cast order_id to Int64
        df_transformed["order_id"] = pd.to_numeric(
            df_transformed["order_id"], errors="coerce"
        ).astype("Int64")

        # 4. Cast amount to float64
        if "amount" in df_transformed.columns:
            # Strip currency symbols if present
            if df_transformed["amount"].dtype == "object":
                cleaned_amount = (
                    df_transformed["amount"]
                    .astype(str)
                    .str.replace(r"[,$€£¥\s]", "", regex=True)
                )
                df_transformed["amount"] = pd.to_numeric(cleaned_amount, errors="coerce")
            else:
                df_transformed["amount"] = pd.to_numeric(df_transformed["amount"], errors="coerce")

        # 5. Normalize created_at to UTC Datetime
        if "created_at" in df_transformed.columns:
            df_transformed["created_at"] = pd.to_datetime(
                df_transformed["created_at"], errors="coerce", utc=True
            )

        # 6. Add ingested_at timestamp (UTC)
        current_time = datetime.now(timezone.utc)
        df_transformed["ingested_at"] = current_time

        logger.info(f"Successfully transformed {len(df_transformed)} records.")
        return df_transformed
