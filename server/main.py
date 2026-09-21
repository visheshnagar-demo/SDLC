import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.config import ALLOWED_ORIGINS, ENABLE_BACKGROUND_POLLER
from server.database import init_db, seed_data, SessionLocal
from server.routers.api_router import router as api_router
from server.routers.health_log_router import router as health_log_router
from server.routers.metrics_router import router as metrics_router
from server.routers.system_router import router as system_router
from server.services.health_poller import start_background_poller
from server.services.retention_worker import start_background_retention_worker

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize schema and seed baseline data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

    poller_task = None
    retention_task = None
    if ENABLE_BACKGROUND_POLLER:
        poller_task = asyncio.create_task(start_background_poller(poll_interval=15))
        retention_task = asyncio.create_task(
            start_background_retention_worker(interval_seconds=86400)
        )
        logger.info("Background tasks started.")

    yield

    # Shutdown: cancel background workers
    if poller_task and not poller_task.done():
        poller_task.cancel()
    if retention_task and not retention_task.done():
        retention_task.cancel()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="API Health Monitoring Dashboard API",
    description="Backend service for registering APIs, monitoring response status and latency, viewing failures, and tracking historical metrics.",
    version="1.0.0",
    lifespan=lifespan,
)

# Mandatory CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(health_log_router, prefix="/api/v1")
app.include_router(metrics_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")


# Global root and health endpoints
@app.get("/", tags=["Root"])
def root():
    return {
        "service": "API Health Monitoring Dashboard",
        "version": "1.0.0",
        "documentation": "/docs",
        "api_prefix": "/api/v1",
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok", "service": "API Health Monitoring Dashboard"}
