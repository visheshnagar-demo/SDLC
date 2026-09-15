CREATE TABLE IF NOT EXISTS `{project}.{dataset}.fct_sales_orders_v1` (
  `id` INTEGER NOT NULL,
  `status` STRING,
  `payload` STRING,
  `created_at` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP NOT NULL
)
PARTITION BY DATE(`order_date`)
CLUSTER BY `order_id`;
