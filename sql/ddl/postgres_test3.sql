CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test3` (
  `id` STRING NOT NULL,
  `name` STRING,
  `email` STRING,
  `status` STRING,
  `data_val` STRING,
  `created_at` TIMESTAMP,
  `_etl_loaded_at` TIMESTAMP
)
PARTITION BY DATE(`_etl_loaded_at`)
CLUSTER BY `id`;
