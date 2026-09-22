# Greenfield Cloud Management System (CloudPulse) - Backend Server

A high-performance FastAPI backend service providing multi-cloud infrastructure orchestration, virtual machine lifecycle management, real-time telemetry metrics, and role-based access control (RBAC).

## Features
- **Authentication & RBAC**: Secure JWT authentication with role enforcement (`admin`, `read_only`).
- **Cloud Provider Management**: Multi-cloud credential configuration (AWS, GCP, Azure).
- **Instance Lifecycle Orchestration**: Start, Stop, Restart, Terminate, and Provision VM instances.
- **Real-Time Telemetry**: CPU, Memory, Disk I/O, and Network utilization metric collection.
- **Immutable Audit Trail**: Structured compliance logging for all administrative operations.

## Test Credentials
The system automatically seeds the following ready-to-use accounts on startup:
- **Administrator**: `email: admin@example.com` / `password: adminpassword` (Full permissions to provision & mutate instances)
- **Read-Only User**: `email: test@example.com` / `password: testpassword` (Can view dashboard, metrics, and audit logs)

## Quick Start (Local Development)

### 1. Prerequisites
- Python 3.11+
- Virtualenv / uv

### 2. Setup Environment
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r server/requirements.txt
```

### 3. Run the Development Server
From the project root:
```bash
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`.

### 4. Running Tests
```bash
pytest server/tests/ -v
```

## API Endpoints Summary
- `POST /api/v1/auth/login` - Authenticate and retrieve JWT token
- `GET /api/v1/auth/me` - Retrieve current user profile
- `GET /api/v1/providers` - List cloud provider accounts
- `POST /api/v1/providers` - Register a new cloud provider (Admin only)
- `GET /api/v1/instances` - List cloud VM instances with status filters
- `GET /api/v1/instances/{instance_id}` - Get instance details
- `POST /api/v1/instances` - Provision a new cloud instance (Admin only)
- `POST /api/v1/instances/{instance_id}/action` - Execute lifecycle actions (START/STOP/RESTART/TERMINATE) (Admin only)
- `GET /api/v1/instances/{instance_id}/metrics` - Retrieve resource telemetry metrics
- `GET /api/v1/audit-logs` - Retrieve audit log records
