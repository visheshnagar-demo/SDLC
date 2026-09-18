CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.viswa` (
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
  `_etl_loaded_at` TIMESTAMP
)
PARTITION BY DATE(`_etl_loaded_at`)
CLUSTER BY `artist`;
