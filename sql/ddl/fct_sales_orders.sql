CREATE TABLE IF NOT EXISTS `{project}.{dataset}.fct_sales_orders` (
  `order_id` STRING NOT NULL,
  `customer_id` STRING,
  `customer_email` STRING NOT NULL,
  `order_date` DATE NOT NULL,
  `amount` NUMERIC NOT NULL,
  `currency` STRING,
  `status` STRING,
  `source_created_at` TIMESTAMP,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`order_date`)
CLUSTER BY `customer_id`, `status`;
