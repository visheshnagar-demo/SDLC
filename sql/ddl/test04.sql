CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test04` (
  `rank` INTEGER,
  `peak` STRING,
  `all_time_peak` STRING,
  `actual_gross` STRING,
  `adjusted_gross_2022` STRING,
  `artist` STRING,
  `tour_title` STRING,
  `years` STRING,
  `shows` INTEGER,
  `average_gross` STRING,
  `ref` STRING,
  `ingestion_timestamp` TIMESTAMP
)
PARTITION BY DATE(`ingestion_timestamp`)
CLUSTER BY `rank`;
