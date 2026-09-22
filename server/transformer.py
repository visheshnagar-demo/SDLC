"""Data Cleaning & Transformation Engine.

Applies whitespace trimming, null normalization, type coercion, deduplication,
quarantine isolation, and audit column enrichment with circuit breaker protection.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
import pandas as pd
from server.config import Settings

logger = logging.getLogger("server.transformer")


class DataTransformer:
    """Cleans, validates, deduplicates, and enriches source dataset."""

    def __init__(self, settings: Settings, batch_id: str | None = None):
        self.settings = settings
        self.batch_id = batch_id or str(uuid.uuid4())

    def transform(
        self,
        df_raw: pd.DataFrame,
        discovered_schema: List[Dict[str, Any]] | None = None,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """Executes full transformation pipeline and enforces circuit breaker."""
        raw_count = len(df_raw)
        logger.info("Beginning transformation of %d raw records (batch_id=%s)", raw_count, self.batch_id)

        if raw_count == 0:
            logger.warning("Empty source dataset received. Returning empty DataFrame.")
            metrics = {
                "batch_id": self.batch_id,
                "extracted": 0,
                "cleaned": 0,
                "duplicates_dropped": 0,
                "quarantined": 0,
                "anomaly_ratio": 0.0,
            }
            return pd.DataFrame(), pd.DataFrame(), metrics

        df = df_raw.copy()

        # ── 1. Column Name Normalization ──────────────────────────────
        df.columns = [str(c).strip().lower() for c in df.columns]

        # ── 2. Null Normalization & Whitespace Trimming ────────────────
        null_markers = {"", "null", "none", "n/a", "na", "\\n", "nan"}
        for col in df.columns:
            if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
                df[col] = df[col].apply(
                    lambda v: None
                    if v is None or (isinstance(v, str) and (v.strip().lower() in null_markers or not v.strip()))
                    else (v.strip() if isinstance(v, str) else v)
                )

        # ── 3. Deduplication ──────────────────────────────────────────
        initial_count = len(df)
        if "id" in df.columns:
            df = df.drop_duplicates(subset=["id"], keep="last")
        else:
            df = df.drop_duplicates(keep="last")
        duplicates_dropped = initial_count - len(df)
        if duplicates_dropped > 0:
            logger.info("Dropped %d duplicate records", duplicates_dropped)

        # ── 4. Type Coercion & Quarantine Validation ──────────────────
        quarantine_records: List[Dict[str, Any]] = []
        valid_indices: List[int] = []

        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            is_valid = True
            error_reason = ""

            # Validate / Coerce ID
            if "id" in row_dict and row_dict["id"] is not None:
                try:
                    row_dict["id"] = int(float(row_dict["id"]))
                except (ValueError, TypeError) as conv_err:
                    is_valid = False
                    error_reason = f"Invalid ID format: {conv_err}"

            # Validate / Coerce Created At Timestamp
            if is_valid and "created_at" in row_dict and row_dict["created_at"] is not None:
                try:
                    dt = pd.to_datetime(row_dict["created_at"], utc=True)
                    if pd.isna(dt):
                        row_dict["created_at"] = None
                    else:
                        row_dict["created_at"] = dt.to_pydatetime()
                except (ValueError, TypeError) as conv_err:
                    is_valid = False
                    error_reason = f"Invalid timestamp format in created_at: {conv_err}"

            # Validate / Coerce String Data
            if is_valid and "data_val" in row_dict and row_dict["data_val"] is not None:
                row_dict["data_val"] = str(row_dict["data_val"]).strip()

            if is_valid:
                valid_indices.append(idx)
            else:
                quarantine_entry = dict(row_dict)
                quarantine_entry["_quarantine_reason"] = error_reason
                quarantine_entry["_quarantined_at"] = datetime.now(timezone.utc).isoformat()
                quarantine_records.append(quarantine_entry)

        df_cleaned = df.loc[valid_indices].copy()
        df_quarantine = pd.DataFrame(quarantine_records)

        # Ensure correct Python/pandas dtypes on cleaned DF
        if not df_cleaned.empty:
            if "id" in df_cleaned.columns:
                df_cleaned["id"] = pd.to_numeric(df_cleaned["id"], errors="coerce").astype("Int64")
            if "created_at" in df_cleaned.columns:
                df_cleaned["created_at"] = pd.to_datetime(df_cleaned["created_at"], utc=True)
            if "data_val" in df_cleaned.columns:
                df_cleaned["data_val"] = df_cleaned["data_val"].astype(str).replace({"<NA>": None, "nan": None, "None": None})

        # ── 5. Audit Metadata Enrichment ──────────────────────────────
        etl_loaded_at = datetime.now(timezone.utc)
        if not df_cleaned.empty:
            df_cleaned["_etl_loaded_at"] = etl_loaded_at
            df_cleaned["_etl_batch_id"] = self.batch_id

        # ── 6. Circuit Breaker Evaluation ─────────────────────────────
        quarantined_count = len(df_quarantine)
        cleaned_count = len(df_cleaned)
        anomaly_ratio = quarantined_count / float(raw_count) if raw_count > 0 else 0.0

        metrics = {
            "batch_id": self.batch_id,
            "extracted": raw_count,
            "cleaned": cleaned_count,
            "duplicates_dropped": duplicates_dropped,
            "quarantined": quarantined_count,
            "anomaly_ratio": round(anomaly_ratio, 4),
            "circuit_breaker_threshold": self.settings.circuit_breaker_threshold,
        }

        logger.info(
            "Transformation metrics: Extracted=%d, Cleaned=%d, Duplicates=%d, Quarantined=%d, AnomalyRatio=%.4f",
            raw_count,
            cleaned_count,
            duplicates_dropped,
            quarantined_count,
            anomaly_ratio,
        )

        if anomaly_ratio > self.settings.circuit_breaker_threshold:
            logger.error(
                "CIRCUIT BREAKER TRIPPED: Anomaly ratio %.4f exceeds maximum threshold %.4f (%d/%d bad rows)",
                anomaly_ratio,
                self.settings.circuit_breaker_threshold,
                quarantined_count,
                raw_count,
            )
            raise RuntimeError(
                f"Circuit breaker tripped: corrupt row ratio ({anomaly_ratio:.2%}) "
                f"exceeds tolerance ({self.settings.circuit_breaker_threshold:.2%})."
            )

        return df_cleaned, df_quarantine, metrics
