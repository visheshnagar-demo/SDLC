# Greenfield Cloud Management System

Centralized multi-cloud infrastructure provisioning, virtual machine lifecycle management, real-time resource telemetry monitoring, and role-based access control.

## Features
- **Multi-Cloud Dashboard**: Real-time KPI metrics, active VM instances, CPU/RAM utilization telemetry charts.
- **Instance Lifecycle Management**: Provision, Start, Stop, Restart, and Terminate virtual machine instances across AWS, GCP, and Azure.
- **Cloud Provider Credentials**: Secure AES-256-GCM encrypted credential storage for AWS, GCP, and Azure accounts.
- **Role-Based Access Control (RBAC)**: Secure access gating for `ADMIN` (full lifecycle & credentials management) and `READ_ONLY` (metrics & status monitoring).
- **Immutable Audit Logging**: Full tracking of user actions, lifecycle state transitions, and security operations.

## Architecture & Tech Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite (Local/Test) / PostgreSQL (Prod)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Security**: JWT Authentication, Passlib/Bcrypt, AES-256-GCM encryption

---

### 1. Prerequisites
- Python 3.11+
- `pip` or `uv`

### 2. Setup Virtual Environment
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run Tests
```bash
pytest
```

### 4. Run Backend Server
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Full-Stack Local Development

### 1. Start Backend API
```bash
# Terminal 1: Backend (Port 8000)
cd server
source venv/bin/activate
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend SPA
```bash
# Terminal 2: Frontend (Port 5173)
cd client
npm install
npm run dev
```

### 3. Default Ports
- **Backend API**: `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`)
- **Frontend Console**: `http://localhost:5173`

### 4. Seeded Test Credentials
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@example.com` | `adminpassword` | Full lifecycle, provision, credentials, audit |
| **Read-Only** | `test@example.com` | `testpassword` | View instances, telemetry metrics, logs |

## Server

### Prerequisites
- Python 3.9+
- pip and venv

### Setup

1. Create and activate virtual environment:
```bash
python -m venv server/.venv
# On Windows:
server\.venv\Scripts\activate
# On macOS/Linux:
source server/.venv/bin/activate
```

2. Install dependencies:
```bash
cd server
pip install -r requirements.txt
cd ..
```

### Running Tests
```bash
cd server
python -m pytest -v
cd ..
```

### Starting the Development Server
```bash
# Run from the repo root so that `from server.X` imports resolve correctly
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Full-Stack Local Development

To run both backend and frontend together locally:

### 1. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Start the Backend (Terminal 1)
```bash
python -m venv server/.venv
source server/.venv/bin/activate  # On Windows: server\.venv\Scripts\activate
pip install -r server/requirements.txt
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API: `http://localhost:8000` | API Docs: `http://localhost:8000/docs`

### 3. Start the Frontend (Terminal 2)
```bash
cd client
npm install
npm run dev
```
Frontend: `http://localhost:5173`

The frontend connects to the backend API at `http://localhost:8000` by default via the `VITE_API_BASE_URL` environment variable.

### 4. Test Credentials
If the app has authentication, the backend seeds ready-to-use accounts on startup
(idempotent). These are guaranteed logged-in-able — every activation/verification
gate (`is_active`, `is_verified`, `email_verified`, `disabled`) is set to the
permissive value, so no manual DB step is needed:
- **Regular user** — Email: `test@example.com`, Password: `testpassword`
- **Admin user** (only when the app has roles/RBAC) — Email: `admin@example.com`, Password: `adminpassword`, role: `admin`

Passwords are stored hashed with the app's own hashing utility (never in plaintext).

### Port Reference
| Service  | Port | URL                        |
|----------|------|----------------------------|
| Backend  | 8000 | http://localhost:8000      |
| Frontend | 5173 | http://localhost:5173      |
| API Docs | 8000 | http://localhost:8000/docs |

