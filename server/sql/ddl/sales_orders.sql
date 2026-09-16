-- BigQuery DDL for Sales Orders Table
-- Partitioned by DATE(created_at) and Clustered by customer_id, order_status

CREATE TABLE IF NOT EXISTS `{project}.{dataset}.sales_orders` (
  `order_id` STRING NOT NULL OPTIONS(description="Natural primary key of the sales order"),
  `customer_id` STRING NOT NULL OPTIONS(description="Customer identifier"),
  `customer_name` STRING OPTIONS(description="Customer full name"),
  `customer_email` STRING OPTIONS(description="Customer email address"),
  `product_category` STRING OPTIONS(description="Product category / classification"),
  `amount` FLOAT64 NOT NULL OPTIONS(description="Cleansed monetary value"),
  `currency` STRING NOT NULL OPTIONS(description="ISO Currency Code"),
  `order_status` STRING NOT NULL OPTIONS(description="Order processing status"),
  `created_at` TIMESTAMP NOT NULL OPTIONS(description="Order creation timestamp (UTC)"),
  `ingested_at` TIMESTAMP NOT NULL OPTIONS(description="ETL ingestion audit timestamp (UTC)")
)
PARTITION BY DATE(`created_at`)
CLUSTER BY `customer_id`, `order_status`
OPTIONS(
  description="Partitioned and clustered sales orders analytical table populated via daily batch ETL."
);
