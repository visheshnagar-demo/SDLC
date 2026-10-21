# Hospital Management System (CarePulse OS) &mdash; SCRUM-458

A unified, secure, and compliant Hospital Management System web application providing centralized patient registration, doctor schedule configuration, outpatient appointment booking with atomic slot reservation, electronic medical records (EMR), and strict Role-Based Access Control (RBAC).

## Architecture & Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x ORM, SQLite (local/test) / PostgreSQL (production)
- **Frontend**: React 18, Vite, Tailwind CSS, Axios, Lucide React icons, React Router DOM
- **Authentication**: JWT Bearer Tokens with discrete role scopes (`ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PATIENT`)
- **Compliance**: HIPAA and GDPR Protected Health Information (PHI) audit logging

---

## Full-Stack Local Development

### 1. Server Setup (Backend - FastAPI)
```bash
# Navigate to repository root
cd server

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server (Port 8000)
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Client Setup (Frontend - React + Vite)
```bash
# Navigate to client directory
cd client

# Install NPM dependencies
npm install

# Start Vite development server (Port 5173)
npm run dev
```
Web application will be accessible at: `http://localhost:5173`

---

## Default Seeded Accounts & Credentials

The system seeds ready-to-use accounts on startup with pre-configured role permissions:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `adminpassword` | Full system governance, all access scopes |
| **Doctor** | `doctor@example.com` | `doctorpassword` | Clinical notes, prescriptions, schedule config (Dr. Marcus Smith) |
| **Staff / Receptionist** | `test@example.com` | `testpassword` | Patient registration, appointment booking |
| **Patient** | `patient@example.com` | `patientpassword` | Self-service appointment scheduling |

---

## Running Automated Backend Tests

```bash
# Run pytest with in-memory SQLite database
TESTING=true pytest server/tests -v
```

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

## Frontend (client/)

### Prerequisites
- Node.js 18+ and npm 8+

### Setup

1. Install dependencies:
```bash
cd client
npm install
cd ..
```

### Available Commands

**Development Server:**
```bash
cd client
npm run dev
cd ..
```
Opens the app at `http://localhost:5173`

**Production Build:**
```bash
cd client
npm run build
cd ..
```
Creates optimized build in `client/dist/`

**Run Tests:**
```bash
cd client
npm test
cd ..
```

**Build & Preview:**
```bash
cd client
npm run preview
cd ..
```
Preview production build locally

### Environment Variables

The frontend comes with a pre-configured `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000
```

The frontend connects to the backend API at this URL. For production deployment, set `VITE_API_BASE_URL` to the deployed backend URL via `--build-arg` in Docker or via your CI/CD environment.

### Running with the Backend

The frontend requires the backend server to be running. See the **Full-Stack Local Development** section in this README for complete setup instructions.

