CREATE TABLE IF NOT EXISTS `{project}.{dataset}.vishesh-test1` (
  `order_id` INTEGER NOT NULL,
  `customer_id` STRING NOT NULL,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT,
  `currency` STRING,
  `order_status` STRING,
  `created_at` TIMESTAMP NOT NULL,
  `_etl_ingested_at` TIMESTAMP NOT NULL,
  `_etl_batch_id` STRING NOT NULL,
  `_etl_source_file` STRING NOT NULL
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `order_id`, `customer_id`;
