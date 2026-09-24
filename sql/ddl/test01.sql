CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test01` (
  `rank` INTEGER,
  `peak` INTEGER,
  `all_time_peak` INTEGER,
  `actual_gross` INTEGER,
  `adjusted_gross_in_2022_dollars` INTEGER,
  `artist` STRING,
  `tour_title` STRING,
  `years` STRING,
  `shows` INTEGER,
  `average_gross` INTEGER,
  `ref` STRING,
  `_etl_loaded_at` TIMESTAMP NOT NULL,
  `_source_file` STRING NOT NULL
)
PARTITION BY DATE(`_etl_loaded_at`);
