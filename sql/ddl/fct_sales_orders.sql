CREATE TABLE IF NOT EXISTS `{project}.{dataset}.fct_sales_orders` (
  `order_id` STRING NOT NULL,
  `customer_email` STRING NOT NULL,
  `amount` NUMERIC NOT NULL,
  `order_date` DATE NOT NULL,
  `etl_loaded_at` TIMESTAMP NOT NULL,
  `etl_job_id` STRING NOT NULL
)
PARTITION BY DATE(`order_date`)
CLUSTER BY `order_id`, `customer_email`;
