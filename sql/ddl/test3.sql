CREATE TABLE IF NOT EXISTS `{project}.{dataset}.test3` (
  `rank` INTEGER,
  `name` STRING,
  `quantity` INTEGER,
  `amount` FLOAT,
  `amount_inr` FLOAT,
  `exchange_rate` FLOAT,
  `us_time` STRING,
  `indian_date` STRING,
  `indian_time` STRING,
  `ingested_at` TIMESTAMP
)
PARTITION BY DATE(`ingested_at`);
