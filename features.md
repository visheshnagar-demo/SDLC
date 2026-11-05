# Project Features

## SCRUM-241 - Payment Gateway Service & Full-Stack UI with Stripe, Digital Wallets, Multi-Currency, Refund Portal & Analytics Dashboard

### Feature Summary
Enables customers to purchase products using cards or digital wallets in their chosen currency, allows operations admins to manage refunds, and gives finance analysts transaction insights and webhook logs via a React/Vite/Tailwind UI connected to FastAPI backend APIs.

### Key Features
- Credit Card Processing via Stripe integration
- Digital Wallet Support (Apple Pay, Google Pay)
- Real-Time Multi-Currency Conversion
- Automated Refund Processing Management
- Webhook Event Handling for transaction lifecycle events
- PCI-Compliant Audit Logging
- REST APIs for payment initiation, checkout sessions, refund processing, and transaction status reporting
- Customer Checkout Page with credit card form, express wallets, currency selector, and status feedback
- Refund Management Portal with transaction search, inspection modal, refund trigger, and audit trail
- Transaction Analytics Dashboard with KPI cards, filterable ledger, currency indicators, and webhook log viewer
- Full-Stack REST API Integration via Axios client using VITE_API_BASE_URL

## SCRUM-300 - Build Daily Batch ETL Data Pipeline Deployed as Cloud Run Job

### Feature Summary
As a Data Engineer / Analytics User, I want to automatically ingest daily sales order CSV files from GCS, clean/deduplicate records, and load them into a partitioned BigQuery table analytics.new_sales_orders so that reliable sales data is available for downstream analytics.

### Key Features
- Daily batch ETL pipeline running as a Cloud Run Job
- GCS CSV data ingestion from gs://sdlc-workspec-store/etl/data/raw_sales_data.csv
- Record cleaning and deduplication on unique order identifiers
- Data loading into partitioned BigQuery table analytics.new_sales_orders
