-- DDL for analytics.new_sales_orders
CREATE TABLE IF NOT EXISTS `analytics.new_sales_orders` (
    order_id STRING NOT NULL OPTIONS(description="Unique identifier for the sales order"),
    customer_id STRING NOT NULL OPTIONS(description="Customer identifier"),
    product_id STRING NOT NULL OPTIONS(description="Product SKU / Identifier"),
    product_category STRING OPTIONS(description="Category of the purchased item"),
    quantity INT64 NOT NULL OPTIONS(description="Number of items purchased (> 0)"),
    unit_price NUMERIC(12, 2) NOT NULL OPTIONS(description="Price per unit"),
    total_amount NUMERIC(12, 2) NOT NULL OPTIONS(description="Total monetary value (quantity * unit_price)"),
    order_status STRING NOT NULL OPTIONS(description="Order state (COMPLETED, PENDING, CANCELLED)"),
    created_at TIMESTAMP NOT NULL OPTIONS(description="Order placement timestamp (Partition Key)"),
    ingested_at TIMESTAMP NOT NULL OPTIONS(description="Pipeline batch ingestion timestamp (UTC)"),
    batch_id STRING NOT NULL OPTIONS(description="Unique UUID representing the pipeline batch execution")
)
PARTITION BY DATE(created_at)
CLUSTER BY customer_id, product_category
OPTIONS (
    description = "Partitioned and clustered sales orders table for analytical reporting"
);
