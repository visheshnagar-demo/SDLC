# Project Features

## SCRUM-289 - ETL Pipeline: Extract PostgreSQL Sales Orders, Filter Invalid Data, and Load to Partitioned BigQuery Table

### Feature Summary
As a Data Engineer / Analytics Engineer, I want an automated ETL pipeline that extracts sales orders from PostgreSQL raw_sales_orders, filters out records with missing amounts or invalid emails, and loads cleaned data into BigQuery fct_sales_orders partitioned by order date, so that downstream analytics and business intelligence reports receive accurate, high-quality sales data with optimal query performance and reduced scanning costs.

### Key Features
- Extract sales order records from PostgreSQL table raw_sales_orders.
- Validate and filter out invalid records (null/missing order amount, invalid email address format).
- Transform cleaned records and load into BigQuery target table fct_sales_orders.
- Partition BigQuery target table by order_date column for query optimization.
