CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.new_sales_orders` (
  order_id STRING OPTIONS(description="Unique sales order identifier"),
  order_date DATE OPTIONS(description="Date of order placement (partition key)"),
  customer_id STRING OPTIONS(description="Customer reference identifier"),
  customer_name STRING OPTIONS(description="Customer full name"),
  customer_email STRING OPTIONS(description="Customer contact email"),
  product_category STRING OPTIONS(description="Product category identifier"),
  amount NUMERIC OPTIONS(description="Order total monetary amount"),
  currency STRING OPTIONS(description="Three-letter ISO currency code"),
  order_status STRING OPTIONS(description="Status of order fulfillment"),
  created_at TIMESTAMP OPTIONS(description="Original order creation timestamp in UTC"),
  ingestion_timestamp TIMESTAMP OPTIONS(description="Timestamp when record was processed by ETL")
)
PARTITION BY order_date
CLUSTER BY customer_id, order_status
OPTIONS(
  description="Sales orders dataset ingested and transformed from GCS batch pipeline"
);
