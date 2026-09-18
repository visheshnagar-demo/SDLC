# Flowers Management System - Backend

A FastAPI backend for the Flowers Management System, managing flower inventory, orders, suppliers, categories, and sales analytics.

## Tech Stack
- Python 3.11
- FastAPI
- SQLAlchemy 2.x
- SQLite (testing & local dev) / PostgreSQL (production)
- pytest & httpx

## Setup & Running Locally

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the development server:
```bash
uvicorn server.main:app --reload --port 8000
```

4. Run tests:
```bash
pytest server/tests
```

## Full-Stack Local Development
- **Backend API**: Runs on http://localhost:8000
- **Frontend App**: Runs on http://localhost:5173
