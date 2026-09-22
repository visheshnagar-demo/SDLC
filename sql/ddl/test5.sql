CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test5` (
  `id` STRING NOT NULL,
  `status` STRING,
  `value` FLOAT64,
  `raw_data` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP,
  `ingested_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`, `status`;
