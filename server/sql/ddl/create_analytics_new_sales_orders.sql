-- DDL for Partitioned and Clustered Sales Orders Table in BigQuery
-- Project: upbeat-repeater-477110-q6
-- Dataset: analytics
-- Table:   new_sales_orders

CREATE TABLE IF NOT EXISTS `analytics.new_sales_orders` (
  order_id STRING NOT NULL OPTIONS(description="Unique sales order identifier"),
  customer_id STRING NOT NULL OPTIONS(description="Unique customer identifier"),
  product_id STRING NOT NULL OPTIONS(description="Product SKU/identifier"),
  product_category STRING OPTIONS(description="Product category taxonomy"),
  quantity INT64 NOT NULL OPTIONS(description="Purchased item quantity"),
  unit_price NUMERIC NOT NULL OPTIONS(description="Unit price per item"),
  total_amount NUMERIC NOT NULL OPTIONS(description="Total monetary amount"),
  order_status STRING NOT NULL OPTIONS(description="Order fulfillment status"),
  created_at TIMESTAMP NOT NULL OPTIONS(description="Order placement timestamp"),
  ingested_at TIMESTAMP NOT NULL OPTIONS(description="Pipeline ingestion timestamp"),
  batch_id STRING NOT NULL OPTIONS(description="ETL batch execution UUID")
)
PARTITION BY DATE(created_at)
CLUSTER BY customer_id, product_id
OPTIONS(
  description="Partitioned table storing clean, deduplicated sales orders ingested daily from GCS"
);
