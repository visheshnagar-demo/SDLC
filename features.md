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

## SCRUM-2 - Implement Inventory Management System

### Feature Summary
# Implement Inventory Management System

**Objective:**
Provide a comprehensive inventory management system to track stock levels, manage item categories, and generate low-stock alerts across warehouse locations.
This system enables businesses to eliminate stockouts, maintain accurate stock records, and streamline warehouse fulfillment operations.

**Key Features:**
- Real-time stock level tracking across multiple warehouse locations
- Item catalog management with SKU, pricing, and reorder threshold configuration
- Automated low-stock notifications and reorder triggers
- Comprehensive audit logging for manual adjustments, stock transfers, and damages
- Full-stack RESTful API integration with a modern React dashboard

**Description:**
As an Inventory Manager,
I want an inventory management system to track stock levels, monitor item updates, and manage warehouse locations,
So that I can optimize stock availability, prevent stockouts, and streamline fulfillment operations.

**Acceptance Criteria:**
- **Stock Tracking and Real-Time Level Updates:** The system shall maintain real-time visibility into current stock quantities across all inventory items and warehouses.
  - Example: When a shipment of 50 units arrives at Warehouse A, the system immediately updates the stock count from 100 to 150 units.
  - Edge Cases: Out-of-order stock update events are reconciled using timestamped audit logs.
- **Item & Category Management:** The system shall allow creation, modification, and categorization of inventory items with SKU, unit price, threshold values, and reorder levels.
  - Example: An administrator adds a new item "SKU-9901" with a reorder threshold of 10 units.
- **Low Stock Alerts & Notifications:** Automatically generate alerts when stock levels fall below specified reorder thresholds.
  - Example: If SKU-9901 drops to 9 units, an automated low-stock notification is dispatched to the warehouse manager.
- **Audit Logging & Stock Adjustments:** Log all manual stock adjustments, transfers, and inventory reconciliations with timestamp, user ID, and reason codes.
  - Example: A manual adjustment of -2 units due to damage is logged with reason code "DAMAGED_GOODS".

**Technical Requirements:**
- RESTful APIs built with FastAPI (`/api/v1/inventory`, `/api/v1/items`, `/api/v1/stock-adjustments`).
- PostgreSQL database schema storing items, warehouses, stock levels, and audit logs with UUID primary keys.
- React/Vite/Tailwind frontend for inventory tracking dashboard.
- Input validation and role-based access control (RBAC).

### Key Features
- Real-time stock level tracking across multiple warehouse locations
- Item catalog management with SKU, pricing, and reorder threshold configuration
- Automated low-stock notifications and reorder triggers
- Comprehensive audit logging for manual adjustments, stock transfers, and damages
- Full-stack RESTful API integration with a modern React dashboard
