from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db
from server.routers import (
    auth,
    patients,
    doctors,
    appointments,
    ehr,
    audit,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize schema and seed accounts
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend REST API for Hospital Management System (HMS) Core Platform & Patient Portal",
    version="1.0.0",
    lifespan=lifespan,
)

# Mandatory CORS Middleware
allowed_origins_list = [
    origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list if allowed_origins_list else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(ehr.router)
app.include_router(audit.router)


@app.get("/api/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Hospital Management System Core Platform",
        "database": "connected",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.main.py:app", host="0.0.0.0", port=8000, reload=True)
