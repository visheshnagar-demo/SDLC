CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test1` (
  `id` STRING NOT NULL,
  `data` STRING,
  `created_at` TIMESTAMP,
  `_etl_loaded_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`_etl_loaded_at`)
CLUSTER BY `id`;
