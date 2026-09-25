CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test3` (
  `id` STRING,
  `data_payload` STRING,
  `status` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `status`;
