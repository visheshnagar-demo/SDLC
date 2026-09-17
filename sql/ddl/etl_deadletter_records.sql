-- DDL for Dead-Letter Quarantine Table: analytics.etl_deadletter_records
-- Project: upbeat-repeater-477110-q6

CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.etl_deadletter_records`
(
  error_id STRING NOT NULL OPTIONS(description="Unique error record UUID"),
  job_id STRING NOT NULL OPTIONS(description="Ingestion job ID"),
  raw_line_content STRING OPTIONS(description="Raw unparseable text line"),
  error_reason STRING NOT NULL OPTIONS(description="Descriptive reason for quarantine"),
  source_file_path STRING NOT NULL OPTIONS(description="GCS file location"),
  failed_at TIMESTAMP NOT NULL OPTIONS(description="Failure timestamp in UTC")
)
PARTITION BY DATE(failed_at)
CLUSTER BY job_id, error_reason
OPTIONS(
  description="Quarantine repository for corrupted or unparseable records during ETL."
);
