# SDLC - Email Ingestion & AI Categorization System (SCRUM-353)

An intelligent email ingestion, AI categorization, and review dashboard platform.

## Features
- **Email Ingestion**: Upload `.eml`, `.msg`, and `.txt` files (up to 10MB) or enter raw text directly.
- **AI Classification Engine**: Automatically classifies emails into `Work`, `Personal`, `Urgent`, `Promotional`, or `Uncategorized` with confidence scores.
- **Interactive Review & Override**: Search, filter, inspect email details, and manually override classifications with full audit logging.

---

## Backend (Server) Setup & Instructions

### 1. Prerequisites
- Python 3.11+
- Virtualenv or standard venv

### 2. Environment Configuration
Create a `.env` file at the root or set environment variables:
```bash
cp .env.example .env
```

### 3. Setup Virtual Environment & Install Dependencies
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Run Server Locally
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Run Backend Tests
```bash
pytest server/tests -v
```

---

## Full-Stack Local Development

### 1. Start Backend
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000
```
Backend API runs on: `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
```
Frontend application runs on: `http://localhost:5173`.

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

