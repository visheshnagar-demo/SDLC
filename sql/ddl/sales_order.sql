CREATE TABLE IF NOT EXISTS `{project}.{dataset}.sales_order` (
  `order_id` INTEGER NOT NULL,
  `customer_id` STRING NOT NULL,
  `customer_name` STRING NOT NULL,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT,
  `currency` STRING NOT NULL,
  `order_status` STRING NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `order_status`, `product_category`;
