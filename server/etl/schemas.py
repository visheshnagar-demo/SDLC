"""Data schemas and column mappings for the ETL pipeline."""
from typing import List, Any

try:
    from google.cloud import bigquery
    TARGET_SCHEMA = [
        bigquery.SchemaField("id", "STRING", mode="REQUIRED", description="Unique identifier of the record"),
        bigquery.SchemaField("raw_data", "STRING", mode="NULLABLE", description="Raw string or JSON payload from source"),
        bigquery.SchemaField("cleaned_at", "TIMESTAMP", mode="NULLABLE", description="Timestamp when the record was processed/cleaned"),
        bigquery.SchemaField("ingested_at", "TIMESTAMP", mode="REQUIRED", description="ETL ingestion timestamp"),
    ]
except ImportError:
    TARGET_SCHEMA = []

NULL_EQUIVALENTS = {
    "null", "none", "nan", "na", "n/a", "nil", "undefined", "", "\\n", "\\t"
}
