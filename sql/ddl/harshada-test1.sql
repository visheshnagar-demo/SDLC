CREATE TABLE IF NOT EXISTS `{project}.{dataset}.harshada-test1` (
  `order_id` INTEGER NOT NULL,
  `customer_id` STRING,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT,
  `currency` STRING,
  `order_status` STRING,
  `created_at` TIMESTAMP,
  `order_date` DATE NOT NULL,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`order_date`);
