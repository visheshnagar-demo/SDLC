CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test5` (
  `id` STRING,
  `category` STRING,
  `status` STRING,
  `data_payload` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`);
