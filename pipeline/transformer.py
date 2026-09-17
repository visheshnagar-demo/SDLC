"""Data transformation, cleaning, validation, and deduplication engine."""
import logging
from datetime import datetime, timezone
import pandas as pd

logger = logging.getLogger(__name__)

class SalesDataTransformer:
    def __init__(self):
        self.raw_count = 0
        self.cleaned_count = 0
        self.deduplicated_count = 0
        self.quarantined_count = 0

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty:
            logger.info("Empty dataframe received for transformation.")
            return pd.DataFrame()
        self.raw_count = len(df)
        df_clean = df.copy()
        for col in df_clean.select_dtypes(include="object").columns:
            df_clean[col] = df_clean[col].astype(str).str.strip()
        required_cols = ["order_id", "customer_id", "order_date", "product_id", "quantity", "amount"]
        for c in required_cols:
            if c not in df_clean.columns:
                df_clean[c] = None
        if "status" not in df_clean.columns:
            df_clean["status"] = "UNKNOWN"
        valid_mask = (
            df_clean["order_id"].notna() & (df_clean["order_id"] != "") & (df_clean["order_id"] != "nan") &
            df_clean["customer_id"].notna() & (df_clean["customer_id"] != "") & (df_clean["customer_id"] != "nan")
        )
        parsed_dates = pd.to_datetime(df_clean["order_date"], errors="coerce", format="%Y-%m-%d")
        valid_mask = valid_mask & parsed_dates.notna()
        df_clean["order_date"] = parsed_dates.dt.strftime("%Y-%m-%d")
        numeric_qty = pd.to_numeric(df_clean["quantity"], errors="coerce")
        numeric_amt = pd.to_numeric(df_clean["amount"], errors="coerce")
        valid_mask = valid_mask & numeric_qty.notna() & (numeric_qty > 0) & numeric_amt.notna() & (numeric_amt > 0)
        df_valid = df_clean[valid_mask].copy()
        self.quarantined_count = self.raw_count - len(df_valid)
        if self.quarantined_count > 0:
            logger.warning("Quarantined %d invalid records failing schema/numeric constraints", self.quarantined_count)
        if df_valid.empty:
            return pd.DataFrame()
        df_valid["quantity"] = numeric_qty[valid_mask].astype(int)
        df_valid["amount"] = numeric_amt[valid_mask].astype(float)
        df_valid["status"] = df_valid["status"].fillna("UNKNOWN").astype(str).str.upper()
        self.cleaned_count = len(df_valid)
        df_dedup = df_valid.drop_duplicates(subset=["order_id"], keep="last").copy()
        self.deduplicated_count = len(df_dedup)
        now_utc = datetime.now(timezone.utc).isoformat()
        df_dedup["ingested_at"] = now_utc
        logger.info("Transformed records: raw=%d, cleaned=%d, deduplicated=%d, quarantined=%d",
                    self.raw_count, self.cleaned_count, self.deduplicated_count, self.quarantined_count)
        return df_dedup

def transform_sales_data(df: pd.DataFrame) -> pd.DataFrame:
    return SalesDataTransformer().transform(df)
