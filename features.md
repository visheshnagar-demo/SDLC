# Project Features

## SCRUM-299 - Commercial Wire Maker-Checker System

### Feature Summary
Enables commercial banking operations to enforce dual-control authorization on wire transfers exceeding $10,000, preventing internal fraud by requiring a Checker to approve wires initiated by a Maker.

### Key Features
- Wire Transfer Initiation Form (Beneficiary Name, Account Number, Routing Number, Amount)
- Automated Dual Control Thresholding (Amount > $10,000 sets status to PENDING; Amount <= $10,000 auto-approves)
- Approval Queue Data Table for pending transfers
- Dual-Control Rule Enforcement (403 Forbidden error if Maker attempts to approve their own wire)
- User Switcher UI to easily toggle between Maker (User A) and Checker (User B) persona
- Visual Error Feedback (red toast notifications for authorization violations)
