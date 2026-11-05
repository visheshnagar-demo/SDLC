-- BigQuery DDL for partitioned analytics.new_sales_orders table
CREATE TABLE IF NOT EXISTS `analytics.new_sales_orders`
(
  order_id STRING NOT NULL OPTIONS(description="Unique sales order identifier"),
  customer_id STRING NOT NULL OPTIONS(description="Unique customer identifier"),
  product_id STRING NOT NULL OPTIONS(description="Unique product identifier"),
  product_category STRING OPTIONS(description="Product category"),
  quantity INT64 NOT NULL OPTIONS(description="Quantity ordered"),
  unit_price FLOAT64 NOT NULL OPTIONS(description="Unit price of the product"),
  total_amount FLOAT64 NOT NULL OPTIONS(description="Total order amount"),
  order_status STRING NOT NULL OPTIONS(description="Order status"),
  created_at TIMESTAMP NOT NULL OPTIONS(description="Order creation timestamp"),
  ingested_at TIMESTAMP NOT NULL OPTIONS(description="Pipeline ingestion timestamp"),
  batch_id STRING NOT NULL OPTIONS(description="ETL batch run identifier UUID")
)
PARTITION BY DATE(created_at)
CLUSTER BY customer_id, product_id
OPTIONS(
  description = "Daily partitioned sales orders analytics table",
  require_partition_filter = FALSE
);
