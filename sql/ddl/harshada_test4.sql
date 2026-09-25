CREATE TABLE IF NOT EXISTS `{project}.{dataset}.harshada_test4` (
  `order_id` INTEGER,
  `customer_id` STRING,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT,
  `currency` STRING,
  `order_status` STRING,
  `created_at` TIMESTAMP
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `customer_id`, `order_status`;
