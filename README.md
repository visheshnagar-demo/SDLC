# Commercial Wire Maker-Checker System

A full-stack banking application enforcing dual-control authorization on wire transfers exceeding $10,000 to prevent internal fraud.

## Features

- **Wire Initiation Form**: Allows Makers (e.g. "User A") to submit wire transfer requests.
- **Automated Threshold Evaluation**: Wires $\le$ $10,000 are automatically `APPROVED`; wires > $10,000 transition to `PENDING` approval.
- **Checker Approval Queue**: Displays pending high-value transfers.
- **Maker-Checker Segregation**: Server-side enforcement preventing Makers from approving their own wire transfers (returns HTTP 403 Forbidden).
- **User Switcher**: Header controls allowing seamless toggling between "User A (Maker)" and "User B (Checker)" personas.

---

### 1. Environment & Dependencies

Navigate to the project root and set up a Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r server/requirements.txt
```

### 2. Configuration

Copy the example environment configuration:

```bash
cp server/.env.example .env
```

Key environment variables:
- `DATABASE_URL`: SQLite connection string (default: `sqlite:///./wires.db`)
- `ALLOWED_ORIGINS`: Allowed CORS origins for frontend integration (default: `http://localhost:5173,http://localhost:3000`)

### 3. Running Unit Tests

Run the test suite using `pytest`:

```bash
pytest server/tests
```

### 4. Running the Development Server

Start the FastAPI server on port 8000:

```bash
python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation (Swagger UI) is available at:
`http://localhost:8000/docs`

---

## Full-Stack Local Development

To run the complete application (Backend + Frontend):

1. **Start the Backend Service**:
   ```bash
   python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start the Frontend Application**:
   Navigate to the `client/` directory and run:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Open your browser at `http://localhost:5173` to access the Commercial Wire Dashboard.

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

## Client

### Prerequisites
- Node.js 16+ and npm 7+

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

