CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test02` (
  `Rank` INTEGER NOT NULL,
  `Peak` INTEGER,
  `All_Time_Peak` INTEGER,
  `Actual_gross` INTEGER,
  `Adjusted_gross_2022_dollars` INTEGER,
  `Artist` STRING NOT NULL,
  `Tour_title` STRING NOT NULL,
  `Years` STRING,
  `Shows` INTEGER,
  `Average_gross` INTEGER,
  `Ref` STRING,
  `_etl_loaded_at` TIMESTAMP,
  `_source_file` STRING
)
CLUSTER BY `Artist`;
