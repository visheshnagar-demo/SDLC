CREATE TABLE IF NOT EXISTS `{project}.{dataset}.sales_order` (
  `order_id` STRING NOT NULL,
  `customer_id` STRING NOT NULL,
  `product_id` STRING NOT NULL,
  `product_category` STRING,
  `quantity` INTEGER NOT NULL,
  `unit_price` NUMERIC NOT NULL,
  `total_amount` NUMERIC NOT NULL,
  `order_status` STRING NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  `ingested_at` TIMESTAMP NOT NULL,
  `batch_id` STRING NOT NULL
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `customer_id`, `product_category`;
