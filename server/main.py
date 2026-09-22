from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import text

from server.config import settings
from server.database import init_db, engine
from server.routers import auth, watches, cart, orders, wishlist
from server.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed sample data
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RESTful API for buying and selling authenticated second-hand luxury branded watches with concurrency reservation locks.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(watches.router, prefix=settings.API_V1_PREFIX)
app.include_router(cart.router, prefix=settings.API_V1_PREFIX)
app.include_router(orders.router, prefix=settings.API_V1_PREFIX)
app.include_router(wishlist.router, prefix=settings.API_V1_PREFIX)


@app.get(
    "/api/v1/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System Health"],
)
@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System Health"],
)
def health_check():
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {"status": "UP", "database": db_status, "version": settings.VERSION}


@app.get("/api/v1/ready", status_code=status.HTTP_200_OK, tags=["System Health"])
def readiness_check():
    return {"ready": True}


@app.get("/", tags=["System Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX,
    }
