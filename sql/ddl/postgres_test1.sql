CREATE TABLE IF NOT EXISTS `{project}.{dataset}.postgres_test1` (
  `None` STRING,
  `None` STRING,
  `None` FLOAT64,
  `None` BOOLEAN,
  `None` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `id`;
