CREATE TABLE IF NOT EXISTS `analytics.new_sales_orders` (
  order_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  order_date DATE NOT NULL,
  product_id STRING NOT NULL,
  quantity INT64 NOT NULL,
  amount NUMERIC NOT NULL,
  status STRING,
  ingested_at TIMESTAMP NOT NULL
) PARTITION BY order_date CLUSTER BY customer_id, product_id;
