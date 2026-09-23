-- Target BigQuery Table DDL for Sales Orders
CREATE TABLE IF NOT EXISTS `analytics.harshada-test2` (
  order_id INT64 OPTIONS(description="Unique sales order identifier"),
  customer_id STRING OPTIONS(description="Customer identifier"),
  customer_name STRING OPTIONS(description="Full name of customer"),
  customer_email STRING OPTIONS(description="Customer email address"),
  product_category STRING OPTIONS(description="Category of product purchased"),
  amount FLOAT64 OPTIONS(description="Sales order total amount"),
  currency STRING OPTIONS(description="Three-letter ISO currency code"),
  order_status STRING OPTIONS(description="Status of the order"),
  created_at TIMESTAMP OPTIONS(description="Timestamp when order was created in UTC"),
  order_date DATE OPTIONS(description="Transaction date derived from created_at for partitioning"),
  ingestion_timestamp TIMESTAMP OPTIONS(description="UTC timestamp when record was ingested into BigQuery")
)
PARTITION BY order_date
CLUSTER BY customer_id, product_category
OPTIONS (
  description = "Cleaned and deduplicated sales order analytics table",
  require_partition_filter = FALSE
);
