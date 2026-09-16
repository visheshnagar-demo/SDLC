# Project Features

## SCRUM-296 - Commercial Wire Maker-Checker System

### Feature Summary
A commercial banking dashboard that allows Makers to initiate wire transfers and Checkers to approve/reject transfers over $10,000, enforcing dual approval and preventing self-approval.

### Key Features
- Wire Transfer Initiation form
- Auto-approval for wires <= $10,000
- Dual approval requirement for wires > $10,000 (PENDING status)
- Approval Queue data table
- Maker-Checker segregation (creator cannot approve their own wire, HTTP 403 Forbidden)
- User Switcher dropdown and error toast notifications
