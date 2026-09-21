"""Data transformation engine implementing business rules for SCRUM-333."""
import re
import logging
from datetime import datetime, timezone
import pandas as pd

logger = logging.getLogger("pipeline.transformer")


class DataTransformer:
    """Transforms raw transactional data according to business requirements:
    1. Rank sorting ascending with invalid / missing values at the end (NULLS LAST).
    2. Currency conversion of `amount` from USD to INR using runtime exchange rate.
    3. GMT to IST timezone conversion of `us_time` into `indian_date` and `indian_time`.
    """

    def __init__(self, exchange_rate: float = 83.5):
        if exchange_rate <= 0:
            raise ValueError("Exchange rate must be a positive number.")
        self.exchange_rate = float(exchange_rate)

    @staticmethod
    def _clean_numeric_str(series: pd.Series) -> pd.Series:
        """Strips currency symbols ($), commas, footnote annotations, and whitespace."""
        footnote_re = re.compile(r"\[[^\]]*\]")
        strip_re = re.compile(r"[\$,€£¥\s\u00a0]")
        return (
            series.astype(str)
            .str.replace(footnote_re, "", regex=True)
            .str.replace(strip_re, "", regex=True)
            .str.strip()
        )

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies full transformation pipeline to input DataFrame."""
        if df is None or df.empty:
            logger.warning("Empty DataFrame provided to transformer.")
            return pd.DataFrame()

        df_out = df.copy()

        # 1. Standardize column names
        df_out.columns = [
            re.sub(r"[^a-zA-Z0-9_]+", "_", str(col).strip().lower()).strip("_")
            for col in df_out.columns
        ]
        logger.info("Standardized columns: %s", list(df_out.columns))

        # 2. Rank conversion and sorting (Ascending, NULLS LAST)
        if "rank" in df_out.columns:
            cleaned_rank_str = self._clean_numeric_str(df_out["rank"])
            df_out["rank_numeric"] = pd.to_numeric(cleaned_rank_str, errors="coerce")
            df_out = df_out.sort_values(by="rank_numeric", ascending=True, na_position="last").reset_index(drop=True)
            df_out["rank"] = df_out["rank_numeric"].astype("Int64")
            df_out = df_out.drop(columns=["rank_numeric"])
            logger.info("Sorted records by rank ascending with invalid/missing at end.")

        # 3. Currency conversion: USD -> INR using runtime exchange rate
        if "amount" in df_out.columns:
            cleaned_amt = self._clean_numeric_str(df_out["amount"])
            df_out["amount"] = pd.to_numeric(cleaned_amt, errors="coerce")
            df_out["exchange_rate"] = self.exchange_rate
            df_out["amount_inr"] = (df_out["amount"] * self.exchange_rate).round(2)
            logger.info("Converted amount from USD to INR with exchange rate %s", self.exchange_rate)
        else:
            df_out["amount"] = None
            df_out["exchange_rate"] = self.exchange_rate
            df_out["amount_inr"] = None

        # 4. Convert us_time from GMT to IST and split into indian_date and indian_time
        if "us_time" in df_out.columns:
            # Preserve original us_time as string, parse datetime to convert
            clean_time_str = df_out["us_time"].astype(str).str.strip().replace({"nan": None, "None": None, "": None})
            parsed_utc = pd.to_datetime(clean_time_str, errors="coerce", utc=True)
            ist_series = parsed_utc.dt.tz_convert("Asia/Kolkata")

            df_out["indian_date"] = ist_series.dt.strftime("%Y-%m-%d").where(ist_series.notna(), None)
            df_out["indian_time"] = ist_series.dt.strftime("%H:%M:%S").where(ist_series.notna(), None)
            df_out["us_time"] = clean_time_str
            logger.info("Converted us_time GMT to IST (indian_date & indian_time).")
        else:
            df_out["us_time"] = None
            df_out["indian_date"] = None
            df_out["indian_time"] = None

        # 5. Handle standard fields: name, quantity
        if "name" in df_out.columns:
            df_out["name"] = df_out["name"].astype(str).str.strip().replace({"nan": None, "None": None, "": None})
        if "quantity" in df_out.columns:
            cleaned_qty = self._clean_numeric_str(df_out["quantity"])
            df_out["quantity"] = pd.to_numeric(cleaned_qty, errors="coerce").astype("Int64")

        # 6. Ingestion audit timestamp
        df_out["ingested_at"] = datetime.now(timezone.utc).isoformat()

        # Reorder columns to align with target schema if possible
        target_order = [
            "rank", "name", "quantity", "amount", "amount_inr",
            "exchange_rate", "us_time", "indian_date", "indian_time", "ingested_at"
        ]
        existing_target_cols = [c for c in target_order if c in df_out.columns]
        extra_cols = [c for c in df_out.columns if c not in target_order]
        df_out = df_out[existing_target_cols + extra_cols]

        logger.info("Transformation finished successfully. Total records: %d", len(df_out))
        return df_out
