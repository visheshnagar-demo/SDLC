"""Pipeline Transformer Module.

Performs data cleaning, whitespace trimming, date coercion, and derived field creation.
Supports both pandas DataFrames and native Python dict lists.
"""
from datetime import datetime, timezone
from typing import Union, List, Dict, Any
from pipeline.logger import get_logger

try:
    import pandas as pd
except ImportError:
    pd = None

logger = get_logger("sales_etl.transformer")


class DataTransformer:
    """Transforms raw sales data into clean, normalized schema."""

    def transform(
        self, data: Union[Any, List[Dict[str, Any]]]
    ) -> Union[Any, List[Dict[str, Any]]]:
        """Transforms and normalizes sales data fields."""
        if data is None:
            return [] if pd is None or not isinstance(data, pd.DataFrame) else pd.DataFrame()

        # Handle Pandas DataFrame
        if pd is not None and isinstance(data, pd.DataFrame):
            if data.empty:
                return pd.DataFrame()

            df = data.copy()
            string_cols = [
                "customer_id",
                "customer_name",
                "customer_email",
                "product_category",
                "currency",
                "order_status",
            ]
            for col in string_cols:
                if col in df.columns:
                    df[col] = (
                        df[col]
                        .astype(str)
                        .str.strip()
                        .replace({"nan": None, "None": None, "null": None, "": None})
                    )

            if "order_id" in df.columns:
                df["order_id"] = pd.to_numeric(df["order_id"], errors="coerce").astype("Int64")

            if "amount" in df.columns:
                clean_amount = (
                    df["amount"]
                    .astype(str)
                    .str.replace(r"[$,€£¥]", "", regex=True)
                    .str.strip()
                )
                df["amount"] = pd.to_numeric(clean_amount, errors="coerce")

            if "created_at" in df.columns:
                df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
                df["order_date"] = df["created_at"].dt.date
            else:
                current_date = datetime.now(timezone.utc).date()
                df["order_date"] = current_date

            today_date = datetime.now(timezone.utc).date()
            df["order_date"] = df["order_date"].fillna(today_date)
            df["ingestion_timestamp"] = pd.Timestamp.now(tz="UTC")

            logger.info("Transformed %d DataFrame records successfully", len(df))
            return df

        # Handle native Python list of dicts
        if isinstance(data, list):
            transformed_rows = []
            now_iso = datetime.now(timezone.utc).isoformat() + "Z"
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            for row in data:
                item = dict(row)

                # Trim strings and normalize nulls
                for col in ["customer_id", "customer_name", "customer_email", "product_category", "currency", "order_status"]:
                    val = item.get(col)
                    if val is not None:
                        s_val = str(val).strip()
                        item[col] = None if s_val.lower() in ("nan", "none", "null", "") else s_val
                    else:
                        item[col] = None

                # Clean order_id
                order_id = item.get("order_id")
                if order_id is not None:
                    try:
                        item["order_id"] = int(float(str(order_id).strip()))
                    except (ValueError, TypeError):
                        item["order_id"] = None

                # Clean amount
                amt = item.get("amount")
                if amt is not None:
                    try:
                        s_amt = str(amt).replace("$", "").replace(",", "").strip()
                        item["amount"] = float(s_amt)
                    except (ValueError, TypeError):
                        item["amount"] = None

                # Clean created_at & derive order_date
                created_at = item.get("created_at")
                if created_at:
                    s_created = str(created_at).strip()
                    item["created_at"] = s_created
                    if len(s_created) >= 10:
                        item["order_date"] = s_created[:10]
                    else:
                        item["order_date"] = today_str
                else:
                    item["order_date"] = today_str

                item["ingestion_timestamp"] = now_iso
                transformed_rows.append(item)

            logger.info("Transformed %d list records successfully", len(transformed_rows))
            return transformed_rows

        raise TypeError(f"Unsupported data format: {type(data)}")
