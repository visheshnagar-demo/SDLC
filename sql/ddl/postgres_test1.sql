CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.postgres_test1` (
  `id` INT64 OPTIONS(description="Record Identifier"),
  `data_val` STRING OPTIONS(description="Sanitized Data Value"),
  `created_at` TIMESTAMP OPTIONS(description="Record Creation Timestamp"),
  `_etl_loaded_at` TIMESTAMP OPTIONS(description="ETL Ingestion UTC Timestamp"),
  `_etl_batch_id` STRING OPTIONS(description="ETL Batch Execution UUID")
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`;
