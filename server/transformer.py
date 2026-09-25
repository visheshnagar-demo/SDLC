"""Data transformation and rank sorting module."""
import logging
import re
from datetime import datetime, timezone
from typing import Tuple, Any, Optional
from server.compat import pd
from server.models import TransformationSummary

logger = logging.getLogger(__name__)


def clean_column_name(col: str) -> str:
    """Normalizes raw CSV column names into snake_case format."""
    # Replace non-breaking space \u00a0 and special whitespace with standard space
    col_clean = col.replace("\u00a0", " ").strip()
    # Normalize known column names
    col_clean = re.sub(r"\(in \d{4} dollars\)", "", col_clean, flags=re.IGNORECASE)
    col_clean = col_clean.replace("(", "").replace(")", "").replace(".", "")
    col_clean = re.sub(r"[^\w\s]", "", col_clean)
    col_clean = re.sub(r"\s+", "_", col_clean).strip("_").lower()
    return col_clean


def clean_numeric_value(val: Any) -> Optional[int]:
    """Cleans currency, footnote annotations, and commas from numerical values."""
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ("null", "none", "nan", "n/a", "-"):
        return None
    # Remove footnote brackets e.g. [1], [4][a]
    val_str = re.sub(r"\[.*?\]", "", val_str)
    # Remove currency symbols, commas, non-numeric chars except minus sign
    val_str = re.sub(r"[^\d\-]", "", val_str)
    if not val_str or val_str == "-":
        return None
    try:
        return int(float(val_str))
    except (ValueError, TypeError):
        return None


def clean_string_value(val: Any) -> Optional[str]:
    """Cleans string values, stripping extra whitespace and empty representations."""
    if pd.isna(val) or val is None:
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ("null", "none", "nan", "n/a"):
        return None
    return val_str


class RankSortTransformer:
    """Transforms raw DataFrame, applies cleansing, and orders by rank ascending."""

    COLUMN_MAPPING = {
        "rank": "rank",
        "peak": "peak",
        "all_time_peak": "all_time_peak",
        "actual_gross": "actual_gross",
        "adjusted_gross": "adjusted_gross_2022_dollars",
        "adjusted_gross_2022_dollars": "adjusted_gross_2022_dollars",
        "artist": "artist",
        "tour_title": "tour_title",
        "years": "years",
        "year_s": "years",
        "year": "years",
        "shows": "shows",
        "average_gross": "average_gross",
        "ref": "ref",
    }

    NUMERIC_COLUMNS = {
        "rank",
        "peak",
        "all_time_peak",
        "actual_gross",
        "adjusted_gross_2022_dollars",
        "shows",
        "average_gross",
    }

    STRING_COLUMNS = {
        "artist",
        "tour_title",
        "years",
        "ref",
    }

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, TransformationSummary]:
        """Executes full transformation suite and sorts ascending by rank."""
        logger.info("Starting DataFrame transformation with %d rows", len(df))
        df_out = df.copy()

        # Step 1: Normalize column names
        normalized_cols = {}
        for col in df_out.columns:
            cleaned = clean_column_name(col)
            target_col = self.COLUMN_MAPPING.get(cleaned, cleaned)
            normalized_cols[col] = target_col
        df_out = df_out.rename(columns=normalized_cols)

        # Step 2: Validate presence of 'rank' column
        if "rank" not in df_out.columns:
            raise KeyError(
                f"Missing required 'rank' column in source data. Available columns: {list(df_out.columns)}"
            )

        # Step 3: Type cleansing and sanitization
        for col in df_out.columns:
            if col in self.NUMERIC_COLUMNS:
                df_out[col] = df_out[col].apply(clean_numeric_value).astype("Int64")
            elif col in self.STRING_COLUMNS:
                df_out[col] = df_out[col].apply(clean_string_value)
            else:
                # Dynamic column: strip if string, leave otherwise
                df_out[col] = df_out[col].apply(
                    lambda v: clean_string_value(v) if isinstance(v, str) else (None if pd.isna(v) else v)
                )

        # Step 4: Sort ascending by rank with nulls placed at the end
        null_ranks = df_out["rank"].isna().sum()
        df_out = df_out.sort_values(by="rank", ascending=True, na_position="last").reset_index(drop=True)

        # Step 5: Append audit column
        ingestion_time = datetime.now(timezone.utc)
        df_out["_ingested_at"] = ingestion_time

        summary = TransformationSummary(
            transformed_row_count=len(df_out),
            transformed_columns=list(df_out.columns),
            sorted_by="rank",
            null_ranks_count=int(null_ranks)
        )

        logger.info(
            "Transformation completed: %d rows sorted by rank (null ranks: %d)",
            summary.transformed_row_count,
            summary.null_ranks_count
        )
        return df_out, summary
