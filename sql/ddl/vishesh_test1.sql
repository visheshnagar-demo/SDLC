-- BigQuery Table DDL for vishesh_test1 (analytics.vishesh-test1)
-- Generated for SCRUM-358 ETL Pipeline

CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.vishesh-test1`
(
  order_id INT64 NOT NULL OPTIONS(description="Unique integer identifier for the sales order"),
  customer_id STRING NOT NULL OPTIONS(description="Customer unique identifier"),
  customer_name STRING NOT NULL OPTIONS(description="Customer full name"),
  customer_email STRING OPTIONS(description="Customer email address"),
  product_category STRING OPTIONS(description="Product category name"),
  amount FLOAT64 OPTIONS(description="Order transaction total amount"),
  currency STRING NOT NULL OPTIONS(description="Currency ISO code"),
  order_status STRING NOT NULL OPTIONS(description="Order fulfillment status"),
  created_at TIMESTAMP NOT NULL OPTIONS(description="Order creation timestamp"),
  ingested_at TIMESTAMP NOT NULL OPTIONS(description="Pipeline ingestion timestamp")
)
PARTITION BY DATE(created_at)
CLUSTER BY order_status, product_category
OPTIONS(
  description="Partitioned and clustered sales orders table for analytical reporting"
);
