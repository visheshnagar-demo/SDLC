# SCRUM-299: Commercial Wire Maker-Checker System

A dual-control wire transfer application for commercial banking operations, enforcing segregation of duties and dual authorization for wire transfers over $10,000 USD.

## Features

- **Wire Transfer Initiation**: Form accepting Beneficiary Name, Account Number, Routing Number, and Amount ($ USD).
- **Automated Dual Control Thresholding**:
  - Amount > $10,000 USD → Status set to `PENDING` (requires Checker authorization).
  - Amount <= $10,000 USD → Status automatically set to `APPROVED`.
- **Pending Approval Queue**: Real-time queue for Checkers to review high-value transfers.
- **Segregation of Duties (Dual Control)**: Backend enforces same-user approval prevention (HTTP 403 Forbidden if Maker attempts self-approval).
- **Wire Rejection Workflow**: Allows Checkers to reject pending wires.
- **User Persona Switcher**: Seamlessly toggle between `User A` (Maker) and `User B` (Checker).

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide React

### 1. Requirements

- Python 3.11+
- Virtual environment (`venv`)

### 2. Installation & Running

```bash
# Navigate to server directory
cd server

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
uvicorn server.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000/api/wires`.

### 3. Running Backend Tests

```bash
cd server
pytest
```

## Full-Stack Local Development

1. Start Backend Server on Port 8000:
   ```bash
   cd server
   uvicorn server.main:app --reload --port 8000
   ```
2. Start Frontend Dev Server on Port 5173:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

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

