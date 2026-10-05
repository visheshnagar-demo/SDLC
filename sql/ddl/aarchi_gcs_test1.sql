CREATE TABLE IF NOT EXISTS `{project}.{dataset}.aarchi_gcs_test1` (
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
  `ingestion_timestamp` TIMESTAMP NOT NULL,
  `etl_batch_id` STRING NOT NULL
)
PARTITION BY DATE(`order_date`)
CLUSTER BY `order_id`, `customer_id`, `order_status`;
