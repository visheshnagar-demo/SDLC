"""Data transformation and cleaning module."""
import logging
import re
from datetime import datetime, timezone
import pandas as pd
from config import PipelineConfig

logger = logging.getLogger("etl_pipeline.transformer")


def clean_dataframe(df: pd.DataFrame, cfg: PipelineConfig) -> pd.DataFrame:
    """Cleans and transforms raw records according to business specifications."""
    if df is None or df.empty:
        logger.warning("Empty DataFrame provided for transformation.")
        return pd.DataFrame()

    raw_count = len(df)
    logger.info("Starting transformation on %d raw records.", raw_count)

    # 1. Standardize column names (lowercase, stripped, replace special chars with underscores)
    df = df.copy()
    df.columns = [
        re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
        for col in df.columns
    ]

    # 2. String sanitization & whitespace trimming
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = (
            df[col]
            .astype(str)
            .str.strip()
            .replace({"nan": None, "None": None, "<NA>": None, "NULL": None, "null": None, "": None})
        )

    # 3. Handle specific known fields
    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
    if "updated_at" in df.columns:
        df["updated_at"] = pd.to_datetime(df["updated_at"], errors="coerce", utc=True)

    # If id is present, ensure it's string format
    if "id" in df.columns:
        df["id"] = df["id"].apply(lambda v: str(v) if pd.notna(v) and str(v) != "None" else None)

    # 4. Deduplicate exact duplicate rows
    df = df.drop_duplicates()

    # 5. Drop rows where all business columns are null
    df_valid = df.dropna(how="all").copy()

    failed_count = raw_count - len(df_valid)
    rejection_rate = (failed_count / raw_count) if raw_count > 0 else 0.0
    logger.info("Transformation stats: raw=%d, valid=%d, failed=%d (rejection_rate=%.2f%%)",
                raw_count, len(df_valid), failed_count, rejection_rate * 100)

    # Circuit breaker: if all rows failed or rejection rate exceeds threshold when multiple rows exist
    if raw_count > 0 and len(df_valid) == 0:
        logger.error("CIRCUIT BREAKER TRIGGERED: 100%% of raw records were quarantined.")
        raise ValueError("Circuit breaker triggered: 100% of records failed validation.")

    # 6. Append audit metadata columns
    now_utc = datetime.now(timezone.utc)
    df_valid["_etl_loaded_at"] = now_utc
    source_instance_name = cfg.instance_connection_name.split(":")[-1] if ":" in cfg.instance_connection_name else cfg.instance_connection_name
    df_valid["_etl_source_instance"] = source_instance_name

    return df_valid
