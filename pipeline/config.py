"""Configuration module for Sales Order ETL pipeline."""
import os

GCS_SOURCE_PATH = os.getenv("GCS_SOURCE_PATH", "gs://sdlc-workspec-store/etl/data/raw_sales_data.csv")
GCP_PROJECT = os.getenv("GCP_PROJECT_ID") or os.getenv("PROJECT_ID") or "upbeat-repeater-477110-q6"
BQ_DATASET = os.getenv("BIGQUERY_DATASET", "analytics")
BQ_TABLE = os.getenv("BIGQUERY_TABLE", "harshada-test3")
BQ_TARGET_REF = f"{GCP_PROJECT}.{BQ_DATASET}.{BQ_TABLE}"
