CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING NOT NULL,
  `raw_data` STRING,
  `cleaned_at` TIMESTAMP,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`ingested_at`)
CLUSTER BY `id`;
