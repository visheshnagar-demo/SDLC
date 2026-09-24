CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING NOT NULL,
  `data_payload` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP,
  `_etl_loaded_at` TIMESTAMP NOT NULL,
  `_etl_source_instance` STRING NOT NULL
)
PARTITION BY DATE(`_etl_loaded_at`)
CLUSTER BY `id`;
