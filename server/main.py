"""Main FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.routers import auth, providers, instances, metrics, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed default users/providers/instances
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    # Shutdown: clean up resources if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Greenfield Multi-Cloud Management System REST API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
allowed_origins_list = [
    origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()
]
if not allowed_origins_list:
    allowed_origins_list = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    """Service healthcheck probe."""
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": "1.0.0"}


# Mount API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(providers.router, prefix=settings.API_V1_STR)
app.include_router(instances.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
