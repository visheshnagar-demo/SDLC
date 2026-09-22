CREATE TABLE IF NOT EXISTS `{project}.{dataset}.harshada-test1` (
  `order_id` INT64 NOT NULL,
  `customer_id` STRING,
  `customer_name` STRING,
  `customer_email` STRING,
  `product_category` STRING,
  `amount` FLOAT64,
  `currency` STRING,
  `order_status` STRING,
  `created_at` TIMESTAMP,
  `order_date` DATE NOT NULL,
  `ingested_at` TIMESTAMP NOT NULL
)
PARTITION BY order_date
OPTIONS (
  description = "Partitioned sales order table populated by Cloud Run Job ETL"
);
