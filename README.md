# Ganesh Temple Management System

A comprehensive web application for managing devotee registrations, pooja and archana bookings, e-Hundi donations, temple inventory, and daily cashier shift reconciliation.

## Features

- **Devotee & Membership Management**: Profile creation, digital Devotee ID generation, family member linkage with Gotra/Rashi details.
- **Pooja & Archana Booking System**: Time slot matrix, atomic slot reservation, QR-code e-pass generation and validation.
- **Donation & e-Hundi Platform**: Multi-fund offerings (Annadanam, Corpus, General Hundi), 80G tax exemption certificates.
- **Inventory & Seva Asset Tracking**: Stock SKU management, low-stock threshold alerting, precious asset (gold/silver) vault audit logging.
- **Financial Accounting & Audit**: Cashier shift open/close reconciliation, zero-variance tracking, consolidated daily revenue reports, immutable audit trail.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x, SQLite (Local/Testing) / PostgreSQL (Prod), PyJWT / Passlib (Auth).
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide Icons.

---

### Prerequisites
- Python 3.11+
- Virtual environment tool (`venv` or `uv`)

### Installation & Execution
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run tests
pytest

# Start Development Server (Port 8000)
uvicorn server.main:app --reload --port 8000
```

---

## Full-Stack Local Development

To run the complete system locally:

1. **Start the Backend Server**:
   ```bash
   cd server
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   uvicorn server.main:app --reload --port 8000
   ```
   The backend API will be available at `http://localhost:8000` (OpenAPI Docs at `http://localhost:8000/docs`).

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The Vite frontend dev server will be available at `http://localhost:5173`.

### Default Configuration & Environment Variables
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:5173`
- Environment variables can be configured via `.env` files in `server/` and `client/`.

### Test Credentials
Seed data is automatically initialized on startup with ready-to-use accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `adminpassword` |
| **Head Priest** | `priest@example.com` | `priestpassword` |
| **Counter Cashier** | `cashier@example.com` | `cashierpassword` |
| **Devotee / User** | `test@example.com` | `testpassword` |

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

