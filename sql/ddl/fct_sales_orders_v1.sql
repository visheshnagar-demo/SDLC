CREATE TABLE IF NOT EXISTS `{project}.{dataset}.fct_sales_orders_v1` (
  `order_id` STRING NOT NULL,
  `customer_id` STRING,
  `customer_name` STRING,
  `customer_email` STRING NOT NULL,
  `order_date` DATE NOT NULL,
  `amount` NUMERIC NOT NULL,
  `currency` STRING,
  `status` STRING,
  `extracted_at` TIMESTAMP,
  `loaded_at` TIMESTAMP
)
PARTITION BY DATE(`order_date`)
CLUSTER BY `customer_id`, `status`;
