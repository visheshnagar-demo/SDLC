# Hospital Management System (HMS) — CarePulse OS

A modern, full-stack Hospital Management System for patient registration, doctor schedule management, real-time appointment booking with atomic slot locking, Electronic Medical Records (EMR), and role-based access control (RBAC).

---

## 🛠️ Tech Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.x, PostgreSQL / SQLite, Pytest
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router DOM
- **Authentication**: JWT (JSON Web Tokens) with RBAC (`ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PATIENT`)

---

## 🚀 Full-Stack Local Development

### 1. Environment Configuration
Create a `.env` file at the repository root based on `.env.example`:
```bash
cp .env.example .env
```

### 2. Backend Setup & Startup (Port 8000)
```bash
# Navigate to server directory
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup & Startup (Port 5173)
```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend will be available at `http://localhost:5173` and automatically communicate with the backend at `http://localhost:8000`.

---

## 🔑 Test Credentials
The database is automatically and idempotently seeded with the following accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `adminpassword` | Full system access, users, doctor schedules, records |
| **Receptionist** | `test@example.com` | `testpassword` | Patient registration, appointment booking & schedules |
| **Doctor** | `doctor@example.com` | `doctorpassword` | Outpatient schedules, appointment status, clinical EMR |

---

## 🧪 Running Tests

### Backend Unit & Integration Tests:
```bash
pytest server/tests -v
```

### Frontend Vitest Tests:
```bash
cd client
npm test
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

