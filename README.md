# Commercial Wire Maker-Checker System

A full-stack commercial banking application for wire transfer management featuring threshold auto-approval and Maker-Checker segregation of duties.

## Features
- **Wire Transfer Initiation**: Submit wire transfers with beneficiary details, financial routing numbers, and amount.
- **Automated Threshold Approval**:
  - Wires $\le$ $10,000.00 are automatically set to `APPROVED`.
  - Wires > $10,000.00 are set to `PENDING` and queued for dual-control approval.
- **Segregation of Duties (Dual Control)**:
  - Maker (`createdBy`) cannot approve their own wire transfer. Self-approval attempts return HTTP `403 Forbidden`.
  - A distinct Checker (`approvedBy`) must authorize or reject pending transfers.
- **Approval Queue**: View pending transfers in real-time.

---

### Requirements
- Python 3.11+
- Virtual environment (`venv`)

### Installation & Local Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   Copy `.env.example` or set environment variables:
   ```bash
   cp .env.example .env
   ```

5. **Run Database Initialization & Server:**
   ```bash
   uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Run Unit Tests:**
   ```bash
   pytest server/tests/ -v
   ```

---

## Full-Stack Local Development

### Running Backend and Frontend Together

1. **Start Backend Server:**
   ```bash
   cd server
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   uvicorn server.main:app --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend Development Server:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

- **Backend API**: `http://localhost:8000`
- **Frontend App**: `http://localhost:5173`
- **Interactive API Docs**: `http://localhost:8000/docs`

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

