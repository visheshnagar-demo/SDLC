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

## SCRUM-334 - Build API Health Monitoring Dashboard for API Registration, Status & Latency Tracking, Failure Logging, and Historical Health Analytics

### Feature Summary
An API Health Monitoring Dashboard that enables users to register internal and external API endpoints, track health metrics and latency in real time, inspect failure logs, and view historical health analytics over a 30-day retention period.

### Key Features
- API Endpoint Registration & Management (GET/POST/HEAD, intervals 30s/1m/5m, headers, timeout threshold)
- Real-Time Response Status & Latency Monitoring (Healthy, Degraded, Down status checks)
- Failure Detection & Detailed Logging (HTTP error code, error message, request headers, response body preview)
- Historical Health Analytics & Metrics Retention (30-day retention, response latency charts, uptime percentage calculation)
