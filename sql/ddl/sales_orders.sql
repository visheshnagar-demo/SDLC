CREATE TABLE IF NOT EXISTS `{project}.{dataset}.sales_orders` (
  `order_id` STRING NOT NULL,
  `customer_id` STRING NOT NULL,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT64 NOT NULL,
  `currency` STRING NOT NULL,
  `order_status` STRING NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `customer_id`, `order_status`;
