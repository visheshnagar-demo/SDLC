CREATE TABLE IF NOT EXISTS `{project}.{dataset}.cleaned_sales` (
  `order_id` INTEGER NOT NULL,
  `customer_id` STRING,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT,
  `currency` STRING,
  `order_status` STRING,
  `created_at` TIMESTAMP NOT NULL,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `product_category`, `customer_id`;
