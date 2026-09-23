CREATE TABLE IF NOT EXISTS `analytics.harshada-test3` (
  order_id STRING NOT NULL OPTIONS(description="Unique order identifier"),
  customer_id STRING OPTIONS(description="Customer identifier"),
  customer_name STRING OPTIONS(description="Customer full name"),
  customer_email STRING OPTIONS(description="Customer email address"),
  product_category STRING OPTIONS(description="Product category"),
  amount FLOAT64 OPTIONS(description="Order amount"),
  currency STRING OPTIONS(description="Currency code"),
  order_status STRING OPTIONS(description="Order status"),
  created_at TIMESTAMP NOT NULL OPTIONS(description="Order creation timestamp"),
  order_date DATE NOT NULL OPTIONS(description="Order date (Partition field)"),
  _ingested_at TIMESTAMP NOT NULL OPTIONS(description="Pipeline ingestion timestamp")
)
PARTITION BY order_date
CLUSTER BY customer_id;
