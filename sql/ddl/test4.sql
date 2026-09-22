CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test4` (
  `id` STRING NOT NULL,
  `name` STRING,
  `email` STRING,
  `status` STRING,
  `amount` FLOAT64,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP,
  `ingested_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`, `status`;
