-- DDL for BigQuery Table: analytics.gcs_transformed_data
-- Project: upbeat-repeater-477110-q6

CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.gcs_transformed_data`
(
  record_id STRING NOT NULL OPTIONS(description="Unique record UUID generated during transformation"),
  raw_payload STRING OPTIONS(description="Original raw row content preserved for lineage"),
  data_fields STRING OPTIONS(description="Parsed and sanitized key-value fields from CSV"),
  ingestion_batch_id STRING NOT NULL OPTIONS(description="UUID identifying the specific ETL job run"),
  source_file_path STRING NOT NULL OPTIONS(description="Source GCS path"),
  created_at TIMESTAMP NOT NULL OPTIONS(description="Ingestion timestamp in UTC"),
  updated_at TIMESTAMP NOT NULL OPTIONS(description="Record modification timestamp in UTC")
)
PARTITION BY DATE(created_at)
CLUSTER BY ingestion_batch_id, record_id
OPTIONS(
  description="Staging and transformed analytical data ingested from GCS CSV files."
);
