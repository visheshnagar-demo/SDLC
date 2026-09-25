"""Transformer module for test04 ETL pipeline."""
import re
import logging
from datetime import datetime, timezone

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger("test04_etl.transformer")


class DataTransformer:
    """Transforms raw CSV dataframe into standardized, rank-ordered test04 dataset."""

    COLUMN_MAPPING = {
        "rank": "rank",
        "peak": "peak",
        "all_time_peak": "all_time_peak",
        "actual_gross": "actual_gross",
        "adjusted_gross_in_2022_dollars": "adjusted_gross_2022",
        "adjusted_gross_2022": "adjusted_gross_2022",
        "artist": "artist",
        "tour_title": "tour_title",
        "year_s": "years",
        "years": "years",
        "shows": "shows",
        "average_gross": "average_gross",
        "ref": "ref",
    }

    @staticmethod
    def _sanitize_col_name(col: str) -> str:
        """Sanitizes raw column names by removing non-alphanumeric chars and non-breaking spaces."""
        s = str(col).replace("\u00a0", " ").strip().lower()
        s = re.sub(r"[^a-z0-9]+", "_", s)
        return s.strip("_")

    @classmethod
    def transform(cls, df: "pd.DataFrame") -> "pd.DataFrame":
        """Transforms and orders data by rank ascending."""
        if pd is None:
            raise RuntimeError("FATAL: pandas is required for transformation.")

        if df is None or df.empty:
            logger.warning("Empty DataFrame provided to transformer.")
            return pd.DataFrame(columns=[
                "rank", "peak", "all_time_peak", "actual_gross", "adjusted_gross_2022",
                "artist", "tour_title", "years", "shows", "average_gross", "ref", "ingestion_timestamp"
            ])

        raw_count = len(df)
        logger.info("Transforming %d raw rows. Original columns: %s", raw_count, list(df.columns))

        transformed_df = df.copy()

        # Step 1: Standardize column names
        transformed_df.columns = [cls._sanitize_col_name(c) for c in transformed_df.columns]
        transformed_df = transformed_df.rename(columns=cls.COLUMN_MAPPING)

        # Step 2: Handle 'rank' column (mandatory sorting column)
        if "rank" not in transformed_df.columns:
            raise KeyError("Mandatory column 'rank' missing from source dataset.")

        # Strip footnote annotations if any (e.g. 1[4] -> 1) and cast to numeric
        transformed_df["rank"] = (
            transformed_df["rank"]
            .astype(str)
            .str.replace(r"\[[^\]]*\]", "", regex=True)
            .str.strip()
        )
        transformed_df["rank"] = pd.to_numeric(transformed_df["rank"], errors="coerce").astype("Int64")

        # Step 3: Handle 'shows' column
        if "shows" in transformed_df.columns:
            transformed_df["shows"] = (
                transformed_df["shows"]
                .astype(str)
                .str.replace(r"\[[^\]]*\]", "", regex=True)
                .str.replace(r"[, ]", "", regex=True)
                .str.strip()
            )
            transformed_df["shows"] = pd.to_numeric(transformed_df["shows"], errors="coerce").astype("Int64")
        else:
            transformed_df["shows"] = pd.Series([None] * len(transformed_df), dtype="Int64")

        # Step 4: Clean string columns and strip whitespace
        string_cols = [
            "peak", "all_time_peak", "actual_gross", "adjusted_gross_2022",
            "artist", "tour_title", "years", "average_gross", "ref"
        ]
        for col in string_cols:
            if col in transformed_df.columns:
                transformed_df[col] = transformed_df[col].apply(
                    lambda v: str(v).strip() if pd.notna(v) and str(v).strip().lower() not in ("nan", "none", "") else None
                )
            else:
                transformed_df[col] = None

        # Step 5: Filter out rows without valid rank or completely empty rows
        valid_df = transformed_df.dropna(subset=["rank"]).copy()
        if valid_df.empty and raw_count > 0:
            raise ValueError(
                f"FATAL: All {raw_count} rows failed rank validation. Circuit breaker triggered."
            )

        # Step 6: Order by rank ascending (Requirement: 'and order by rank name it as test04')
        valid_df = valid_df.sort_values(by="rank", ascending=True).reset_index(drop=True)

        # Step 7: Add audit column ingestion_timestamp
        valid_df["ingestion_timestamp"] = pd.Timestamp.now(tz=timezone.utc)

        # Step 8: Ensure all expected columns are present in consistent order
        target_columns = [
            "rank",
            "peak",
            "all_time_peak",
            "actual_gross",
            "adjusted_gross_2022",
            "artist",
            "tour_title",
            "years",
            "shows",
            "average_gross",
            "ref",
            "ingestion_timestamp",
        ]
        for col in target_columns:
            if col not in valid_df.columns:
                valid_df[col] = None

        final_df = valid_df[target_columns].copy()
        logger.info(
            "Transformation successful: %d rows retained and ordered by rank ASC.",
            len(final_df)
        )
        return final_df
