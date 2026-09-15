# Project Features

## SCRUM-286 - ACH Transfer Velocity Limits API for AML Compliance

### Feature Summary
Evaluates outbound ACH transfer requests for a given account against rolling 24-hour limits ($5,000 for AML review flag, $10,000 for rejection with HTTP 429) and returns a correlation ID for audit tracing.

### Key Features
- Rolling 24-Hour Velocity Check: Query and sum all outbound ACH transfers for a given Account ID over the prior 24 hours.
- Hard Limit Rejection ($10,000): Reject any transaction bringing the 24-hour total over $10,000 with HTTP 429 status code and VELOCITY_LIMIT_EXCEEDED error code.
- Soft Limit AML Flagging ($5,000): Approve transactions bringing the 24-hour total above $5,000 up to $10,000, setting requires_aml_review = true on the database record.
- Normal Approval (<= $5,000): Approve transactions normally when 24-hour cumulative amount is under $5,000.
- Audit Tracing & Correlation ID: Include a correlation ID header in API responses for end-to-end tracing.
- Database Query Optimization: Ensure highly optimized queries (indexes on account_id, timestamp/created_at, direction/type) for real-time latency requirements.
