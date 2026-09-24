CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test03` (
  `rank` INTEGER,
  `peak` STRING,
  `all_time_peak` STRING,
  `actual_gross` STRING,
  `adjusted_gross_in_2022_dollars` STRING,
  `artist` STRING,
  `tour_title` STRING,
  `years` STRING,
  `shows` INTEGER,
  `average_gross` STRING,
  `ref` STRING,
  `ingested_at` TIMESTAMP
)
CLUSTER BY `rank`;
