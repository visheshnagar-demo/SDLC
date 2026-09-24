CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test2` (
  `id` STRING,
  `name` STRING,
  `age` INT64,
  `email` STRING,
  `created_at` TIMESTAMP
)
PARTITION BY DATE(`_extracted_at`)
CLUSTER BY `id`;
