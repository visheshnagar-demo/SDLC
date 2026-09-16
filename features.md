# Project Features

## SCRUM-294 - Build Commercial Wire Maker-Checker System with Dual-Approval Threshold

### Feature Summary
Enables commercial banking teams to initiate wire transfers and automatically enforces dual approval for transfers over $10,000 by requiring a separate Checker user to approve pending transactions.

### Key Features
- Wire Transfer Entity & Persistence with SQLite
- Automatic Approval Threshold Logic (<= $10k auto-approved, > $10k pending dual approval)
- Pending Wire Transfer Queue Endpoint
- Maker-Checker Self-Approval Prevention (403 Forbidden on matching createdBy and approvedBy)
- Banking Dashboard with Header Mock User Switcher (Maker vs Checker)
- Wire Transfer Initiation Form with instant feedback
- Approval Queue Table with Approve/Reject actions and Red Error Toast notifications
