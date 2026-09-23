import logging
from datetime import datetime, timezone
from typing import Tuple, Dict, Any
import pandas as pd

logger = logging.getLogger("etl.transformer")

NULL_SENTINEL_VALUES = {"", "n/a", "na", "null", "none", "nan", "undefined"}


class DataTransformer:
    def __init__(
        self,
        id_column: str = "id",
        quarantine_threshold: float = 0.05,
    ):
        self.id_column = id_column
        self.quarantine_threshold = quarantine_threshold

    def clean_and_transform(
        self, df_raw: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Cleans, validates, transforms raw extracted DataFrame, and adds audit metadata.

        Returns:
            Tuple of (cleaned_df, metrics_dict)
        """
        extracted_count = len(df_raw)
        metrics: Dict[str, Any] = {
            "extracted_count": extracted_count,
            "cleaned_count": 0,
            "duplicate_count": 0,
            "quarantined_count": 0,
            "loaded_count": 0,
        }

        if df_raw.empty:
            logger.warning("Extraction returned an empty dataframe (0 rows).")
            return pd.DataFrame(), metrics

        df = df_raw.copy()

        # 1. Whitespace trimming & sentinel null normalization for string/object columns
        for col in df.columns:
            if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
                df[col] = df[col].apply(
                    lambda x: x.strip() if isinstance(x, str) else x
                )
                df[col] = df[col].apply(
                    lambda x: None
                    if (
                        x is None
                        or pd.isna(x)
                        or (
                            isinstance(x, str)
                            and x.strip().lower() in NULL_SENTINEL_VALUES
                        )
                    )
                    else x
                )

        # 2. Schema check / ID validation
        if self.id_column in df.columns:
            # Drop invalid / missing IDs
            valid_id_mask = df[self.id_column].notna() & (
                df[self.id_column].astype(str).str.strip() != ""
            )
            invalid_ids = (~valid_id_mask).sum()
            metrics["quarantined_count"] += int(invalid_ids)
            df = df[valid_id_mask].copy()
            df[self.id_column] = df[self.id_column].astype(str).str.strip()

        # 3. Deduplication
        initial_len = len(df)
        if self.id_column in df.columns:
            df = df.drop_duplicates(subset=[self.id_column], keep="first")
        else:
            df = df.drop_duplicates(keep="first")
        duplicate_count = initial_len - len(df)
        metrics["duplicate_count"] = int(duplicate_count)

        # 4. Type Coercion & Standardization
        if "amount" in df.columns:
            df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

        if "category" in df.columns:
            df["category"] = df["category"].apply(
                lambda x: str(x).upper() if x is not None and not pd.isna(x) else None
            )

        for ts_col in ["created_at", "updated_at"]:
            if ts_col in df.columns:
                df[ts_col] = pd.to_datetime(df[ts_col], errors="coerce", utc=True)

        # 5. Inject Audit Metadata
        now_utc = datetime.now(timezone.utc)
        df["_etl_loaded_at"] = now_utc

        # 6. Verify quarantine threshold
        error_rate = (
            metrics["quarantined_count"] / extracted_count if extracted_count > 0 else 0
        )
        if error_rate > self.quarantine_threshold:
            logger.error(
                "Quarantine rate %.2f%% exceeded threshold %.2f%%",
                error_rate * 100,
                self.quarantine_threshold * 100,
            )

        metrics["cleaned_count"] = len(df)
        metrics["loaded_count"] = len(df)
        logger.info("Transformation finished: %s", metrics)
        return df, metrics
