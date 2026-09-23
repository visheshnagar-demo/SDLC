CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING NOT NULL,
  `name` STRING,
  `value` FLOAT64,
  `status` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`);
