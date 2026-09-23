CREATE TABLE IF NOT EXISTS `{project}.{dataset}.harshada-test3` (
  `order_id` STRING,
  `customer_id` STRING,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT64,
  `currency` STRING,
  `order_status` STRING,
  `created_at` TIMESTAMP,
  `order_date` DATE,
  `_ingested_at` TIMESTAMP
)
PARTITION BY DATE(`order_date`)
CLUSTER BY `order_id`;
