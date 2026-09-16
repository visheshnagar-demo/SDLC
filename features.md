# Project Features

## SCRUM-292 - Build Commercial Wire Maker-Checker System

### Feature Summary
A full-stack banking dashboard that enables Maker users to initiate wire transfers and Checker users to review, approve, or reject high-value wire transfers over $10,000 with strict segregation of duties.

### Key Features
- Wire transfer initiation form with fields for beneficiary name, account, routing, and amount
- Automatic approval for wire transfer amounts <= $10,000
- Dual-approval workflow with PENDING status for wire transfer amounts > $10,000
- Approval Queue table displaying pending transfers with Approve and Reject action buttons
- Maker-Checker segregation of duties blocking self-approval (returns 403 Forbidden)
- Mock User Switcher to toggle between Maker (User A) and Checker (User B)
- Visual error state (red toast) on 403 Forbidden authorization errors
