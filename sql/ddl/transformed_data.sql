CREATE TABLE IF NOT EXISTS `{project}.{dataset}.transformed_data` (
  `id` INTEGER NOT NULL,
  `status` STRING,
  `payload` STRING,
  `created_at` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`;
