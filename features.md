# Project Features

## SCRUM-298 - Implement Commercial Wire Maker-Checker System

### Feature Summary
Enables commercial banking users to initiate wire transfers and allows checkers to review and approve/reject pending high-value transfers from a dedicated dashboard.

### Key Features
- Wire initiation form (Beneficiary Name, Account Number, Routing Number, Amount)
- Auto-approval logic for wires <= $10,000 and PENDING state for wires > $10,000
- Pending Approval Queue data table for Checkers
- Approve/Reject actions with Maker-Checker dual authorization check (403 error on self-approval)
- Mock User Switcher between Maker and Checker accounts
- Red toast notifications for 403 authorization error states
