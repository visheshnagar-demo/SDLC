CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING NOT NULL,
  `name` STRING,
  `age` INT64,
  `email` STRING,
  `created_at` TIMESTAMP,
  `_extracted_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`_extracted_at`)
CLUSTER BY `id`;
