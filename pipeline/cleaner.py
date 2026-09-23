"""Data cleaning and normalization module for Sales Orders ETL."""
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

def clean_sales_data(df):
    """Cleans and normalizes sales order records."""
    import pandas as pd
    import numpy as np

    if df.empty:
        logger.warning("Empty DataFrame provided to cleaner.")
        return df

    cleaned = df.copy()

    # Standardize column names
    cleaned.columns = [c.strip().lower() for c in cleaned.columns]

    # Clean string columns
    str_cols = ["order_id", "customer_id", "customer_name", "customer_email", "product_category", "currency", "order_status"]
    for col in str_cols:
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].astype(str).str.strip()
            cleaned[col] = cleaned[col].replace({"nan": None, "None": None, "": None})

    # Coerce numeric fields
    if "amount" in cleaned.columns:
        cleaned["amount"] = pd.to_numeric(cleaned["amount"], errors="coerce")

    # Parse created_at timestamp and generate order_date
    if "created_at" in cleaned.columns:
        cleaned["created_at"] = pd.to_datetime(cleaned["created_at"], errors="coerce", utc=True)
        cleaned["order_date"] = cleaned["created_at"].dt.date
    elif "order_date" in cleaned.columns:
        cleaned["order_date"] = pd.to_datetime(cleaned["order_date"], errors="coerce").dt.date

    # Drop invalid rows missing critical primary key order_id
    if "order_id" in cleaned.columns:
        cleaned = cleaned[cleaned["order_id"].notna() & (cleaned["order_id"] != "")]

    logger.info("Cleaning complete. %d records survived.", len(cleaned))
    return cleaned
