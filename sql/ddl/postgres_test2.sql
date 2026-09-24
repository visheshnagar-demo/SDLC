CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING,
  `data_payload` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP,
  `_etl_loaded_at` TIMESTAMP,
  `_etl_source_instance` STRING
)
PARTITION BY DATE(`_etl_loaded_at`)
CLUSTER BY `id`;
