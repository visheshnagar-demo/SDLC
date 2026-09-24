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

## SCRUM-384 - Transaction Monitoring and Suspicious Activity Alert Service

### Feature Summary
A real-time transaction monitoring and alert investigation system for banking compliance teams, enabling dynamic fraud rule evaluation (high amount, velocity, impossible travel) and an interactive analyst review dashboard.

### Key Features
- High Transaction Amount Monitoring Rule
- High-Frequency Transaction Velocity Rule
- Geographic Velocity (Impossible Travel) Rule
- Real-Time Alert Generation and Severity Assignment
- Alert Investigation and Management Dashboard (Frontend)
- Dynamic Rule Configuration Interface (Frontend & Backend)
