CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` INTEGER NOT NULL,
  `name` STRING,
  `email` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`;
