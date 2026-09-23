"""Data transformation and cleaning engine."""
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional

try:
    import pandas as pd
except ImportError:
    pd = None

from server.etl.observability import logger
from server.etl.schemas import NULL_EQUIVALENTS


class DataTransformer:
    """Performs deterministic cleaning, type coercion, deduplication, and schema validation."""

    def __init__(self, error_threshold_ratio: float = 0.10):
        self.error_threshold_ratio = error_threshold_ratio

    def clean_and_normalize(
        self, df_raw: Any
    ) -> Tuple[Any, Dict[str, int], List[dict]]:
        """
        Cleans the input dataframe according to standard data quality rules.
        Returns:
            - cleansed DataFrame ready for BigQuery loading
            - stats dict with counts
            - list of quarantined records
        """
        if pd is None:
            raise RuntimeError("pandas package is required for data transformation.")

        if df_raw is None or (hasattr(df_raw, "empty") and df_raw.empty):
            logger.warning("Empty DataFrame received for transformation.")
            return (
                pd.DataFrame(columns=["id", "raw_data", "cleaned_at", "ingested_at"]),
                {
                    "rows_extracted": 0,
                    "rows_cleaned": 0,
                    "rows_deduplicated": 0,
                    "rows_dropped": 0,
                },
                [],
            )

        rows_extracted = len(df_raw)
        df = df_raw.copy()

        # Step 1: Whitespace trimming on string columns
        for col in df.columns:
            if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
                df[col] = df[col].apply(
                    lambda v: v.strip() if isinstance(v, str) else v
                )

        # Step 2: Standardize null equivalents
        for col in df.columns:
            df[col] = df[col].apply(
                lambda v: None
                if isinstance(v, str) and v.strip().lower() in NULL_EQUIVALENTS
                else v
            )

        # Step 3: Ensure required columns exist or map them
        col_map = {str(c).lower(): c for c in df.columns}
        if "id" not in col_map:
            df["id"] = [f"rec_{i+1}" for i in range(len(df))]
        elif col_map["id"] != "id":
            df.rename(columns={col_map["id"]: "id"}, inplace=True)

        if "raw_data" not in df.columns:
            non_id_cols = [c for c in df.columns if c not in ("id", "cleaned_at", "ingested_at")]
            if non_id_cols:
                df["raw_data"] = df[non_id_cols].apply(lambda row: " | ".join(str(val) if pd.notna(val) else "" for val in row), axis=1)
            else:
                df["raw_data"] = None

        if "cleaned_at" not in df.columns:
            df["cleaned_at"] = None

        # Step 4: Quarantine invalid records (missing or null id)
        quarantined = []
        valid_mask = df["id"].notna() & (df["id"].astype(str).str.strip() != "")
        invalid_df = df[~valid_mask]
        if not invalid_df.empty:
            for idx, row in invalid_df.iterrows():
                quarantined.append({"index": int(idx), "reason": "Missing or empty id", "row": row.to_dict()})

        df = df[valid_mask].copy()

        # Step 5: Type coercion
        df["id"] = df["id"].astype(str)

        df["raw_data"] = df["raw_data"].apply(
            lambda v: str(v) if pd.notna(v) and v is not None else None
        )

        current_utc = datetime.now(timezone.utc)
        def parse_timestamp(v):
            if pd.isna(v) or v is None:
                return current_utc
            try:
                ts = pd.to_datetime(v, utc=True)
                return ts.to_pydatetime()
            except (ValueError, TypeError):
                return current_utc

        df["cleaned_at"] = df["cleaned_at"].apply(parse_timestamp)

        # Step 6: Deduplication
        initial_valid_count = len(df)
        df = df.drop_duplicates(subset=["id"], keep="last")
        rows_deduplicated = initial_valid_count - len(df)

        # Step 7: Add ingested_at timestamp
        df["ingested_at"] = pd.Timestamp.now(tz="UTC")

        # Select and order columns matching target schema
        target_columns = ["id", "raw_data", "cleaned_at", "ingested_at"]
        df = df[target_columns].reset_index(drop=True)

        rows_cleaned = len(df)
        rows_dropped = len(quarantined)

        # Step 8: Fail-fast circuit breaker check
        if rows_extracted > 0 and rows_cleaned == 0:
            raise RuntimeError(
                f"Circuit breaker tripped: 100% of extracted records ({rows_extracted} rows) were dropped during cleaning."
            )

        drop_ratio = rows_dropped / rows_extracted if rows_extracted > 0 else 0.0
        if drop_ratio > self.error_threshold_ratio:
            logger.warning(
                f"High record drop ratio: {drop_ratio:.2%} exceeded threshold {self.error_threshold_ratio:.2%}",
                rows_extracted=rows_extracted,
                rows_dropped=rows_dropped,
            )

        stats = {
            "rows_extracted": rows_extracted,
            "rows_cleaned": rows_cleaned,
            "rows_deduplicated": rows_deduplicated,
            "rows_dropped": rows_dropped,
        }

        logger.info(
            "Transformation completed",
            rows_extracted=rows_extracted,
            rows_cleaned=rows_cleaned,
            rows_deduplicated=rows_deduplicated,
            rows_dropped=rows_dropped,
        )

        return df, stats, quarantined
