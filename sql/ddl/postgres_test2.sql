CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING NOT NULL,
  `cleaned_payload` STRING,
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP,
  `etl_ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`etl_ingested_at`)
CLUSTER BY `id`;
