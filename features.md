# Project Features

## SCRUM-297 - Commercial Wire Maker-Checker System

### Feature Summary
Allows commercial banking operations teams to initiate wire transfers with automated approval threshold routing ($10,000 threshold) and dual-control approval queues enforcing segregation of duties.

### Key Features
- Wire transfer initiation with threshold-based automatic status assignment ($10,000 threshold).
- Segregation of duties enforcing dual approval (Maker cannot approve their own wire, returning 403 Forbidden).
- Pending approval queue data table with real-time state refresh and visual toast notifications.
- Mock User Switcher dropdown ("User A (Maker)" vs "User B (Checker)") for role-based dashboard simulation.
