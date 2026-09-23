CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test6` (
  `id` INTEGER,
  `name` STRING,
  `email` STRING,
  `value` FLOAT64,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`;
