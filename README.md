# AI Study Planner &mdash; Personalized Schedule & Priority Generation

An intelligent full-stack AI Study Planner application where learners configure study subjects, define weekly available study windows, and automatically generate optimized, spaced-repetition study schedules with dynamic priority recommendations.

## System Overview
- **Backend**: FastAPI, SQLAlchemy 2.x, SQLite (dev/test) / PostgreSQL (prod), Pydantic v2
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios
- **Algorithms**: Heuristic constraint-satisfaction scheduling engine, difficulty-weighted workload distribution, and dynamic urgency priority scoring.

---

## API Endpoints (`/api/v1`)

### Subjects
- `POST /api/v1/subjects` &mdash; Create a study subject with difficulty level (1-5), target date, and estimated total hours.
- `GET /api/v1/subjects` &mdash; List all configured subjects.
- `GET /api/v1/subjects/{id}` &mdash; Retrieve details for a specific subject.
- `PUT /api/v1/subjects/{id}` &mdash; Update subject configuration.
- `DELETE /api/v1/subjects/{id}` &mdash; Remove a subject.

### Availability Profiles
- `POST /api/v1/availability` &mdash; Save or update weekly available study hours by day of the week.
- `GET /api/v1/availability` &mdash; Retrieve the current weekly availability settings.

### Schedules & Priorities
- `POST /api/v1/schedules/generate` &mdash; Generate an AI-optimized study schedule and priority matrix for selected subjects.
- `GET /api/v1/schedules` &mdash; List all generated study plans.
- `GET /api/v1/schedules/{id}` &mdash; Retrieve detailed schedule with daily study session blocks and ranked priority directives.
- `PATCH /api/v1/schedules/sessions/{session_id}` &mdash; Update session status (`PENDING`, `COMPLETED`, `SKIPPED`, `RESCHEDULED`).
- `DELETE /api/v1/schedules/{id}` &mdash; Delete a study plan.

### System & Health
- `GET /api/v1/health` &mdash; Service health and database connectivity status.

---

## Full-Stack Local Development

### 1. Backend Setup & Run (Port 8000)
```bash
# Navigate to server
cd server

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend API server
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI swagger docs will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup & Run (Port 5173)
```bash
# Navigate to client
cd client

# Install npm dependencies
npm install

# Start development server
npm run dev
```
The frontend UI will be available at `http://localhost:5173`.

### 3. Running Backend Tests
```bash
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

