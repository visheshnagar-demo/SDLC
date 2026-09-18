CREATE TABLE IF NOT EXISTS `{project}.{dataset}.viswa` (
  `record_id` STRING NOT NULL,
  `id` INTEGER,
  `first_name` STRING,
  `last_name` STRING,
  `email` STRING,
  `gender` STRING,
  `ip_address` STRING,
  `ingested_at` TIMESTAMP NOT NULL,
  `source_file` STRING NOT NULL,
  `data_hash` STRING
)
PARTITION BY DATE(`ingested_at`)
CLUSTER BY `record_id`;
