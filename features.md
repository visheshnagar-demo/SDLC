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

## SCRUM-364 - ETL Pipeline: Cloud SQL PostgreSQL to BigQuery Data Ingestion & Cleaning

### Feature Summary
Extract data from Cloud SQL PostgreSQL test_data table, perform data cleaning transformations, and load the cleaned dataset into BigQuery analytics.postgres_test2 table.

### Key Features
- Source Data Extraction from Cloud SQL PostgreSQL (instance upbeat-repeater-477110-q6:us-central1:sdlc-etl-demo-db, database postgres, table test_data)
- Data Cleaning & Transformation (deduplication, whitespace trimming, null handling, schema validation)
- Target Data Loading into BigQuery table analytics.postgres_test2
