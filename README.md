# ACH Transfer Velocity Limits API (SCRUM-286)

A high-performance FastAPI microservice designed for real-time Anti-Money Laundering (AML) compliance by evaluating outbound ACH transfer requests against rolling 24-hour velocity limits.

---

## 🚀 Features

- **Rolling 24-Hour Velocity Tracking**: Dynamically aggregates all outbound ACH transfers per account within a rolling 24-hour window.
- **Hard Limit Enforcement ($10,000.00)**: Rejects transactions pushing the 24-hour sum over $10,000.00 with HTTP `429 Too Many Requests` and error code `VELOCITY_LIMIT_EXCEEDED`.
- **Soft Limit AML Flagging ($5,000.00)**: Approves transfers between $5,000.01 and $10,000.00 while flagging the record with `requires_aml_review = true`.
- **Normal Approval ($\le$ $5,000.00)**: Seamlessly approves transfers within normal thresholds with `requires_aml_review = false`.
- **End-to-End Audit Tracing**: Captures and echoes correlation IDs (`X-Correlation-ID`) across all requests and audit records.
- **Covering Composite Indexes**: Optimized database indexing on `(account_id, direction, created_at, status)` ensuring sub-10ms query latency.

---

## 🛠️ Tech Stack

- **Language**: Python 3.11
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.x
- **Database**: PostgreSQL (Production) / SQLite (Testing)
- **Validation**: Pydantic v2
- **Testing**: Pytest with `fastapi.testclient`

---

## 📋 API Endpoints

### 1. Evaluate ACH Transfer
`POST /api/v1/ach/transfers/evaluate`

**Headers**:
- `X-Correlation-ID` *(optional)*: Tracing UUID (auto-generated if omitted).

**Request Body**:
```json
{
  "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 2500.00,
  "recipient_account": "9876543210",
  "routing_number": "123456789"
}
```

**Responses**:

- **201 Created (Normal Approval $\le$ $5,000)**:
```json
{
  "transfer_id": "e4d29b10-891a-4c2d-9411-2b0e89324021",
  "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 2500.00,
  "rolling_24h_total": 2500.00,
  "status": "APPROVED",
  "requires_aml_review": false,
  "created_at": "2026-09-15T10:15:00Z"
}
```

- **201 Created (Soft Limit AML Review Flag $5,000.01 – $10,000)**:
```json
{
  "transfer_id": "f8a91c20-112b-4e3d-8822-3c1f90435132",
  "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 3000.00,
  "rolling_24h_total": 5500.00,
  "status": "APPROVED",
  "requires_aml_review": true,
  "created_at": "2026-09-15T10:16:00Z"
}
```

- **429 Too Many Requests (Hard Limit Exceeded > $10,000)**:
```json
{
  "error_code": "VELOCITY_LIMIT_EXCEEDED",
  "detail": "Rolling 24-hour ACH transfer limit exceeded.",
  "account_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "attempted_amount": 600.00,
  "current_24h_total": 9500.00,
  "projected_24h_total": 10100.00,
  "limit": 10000.00
}
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Virtualenv or `uv`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/visheshnagar-demo/SDLC.git
cd SDLC

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r server/requirements.txt
```

### 3. Running the Server
```bash
# Start FastAPI application with Uvicorn from the repo root
python -m uvicorn server.app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI documentation is available at: `http://localhost:8000/docs`

### 4. Running Tests
```bash
# Run test suite
pytest server/tests -v
```

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

