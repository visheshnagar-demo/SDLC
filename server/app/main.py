from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.app.core.config import settings
from server.app.core.middleware import CorrelationIdMiddleware
from server.app.db.session import init_db
from server.app.api.v1.endpoints.ach_transfers import router as ach_transfers_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
allowed_origins = [
    origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Correlation ID Middleware
app.add_middleware(CorrelationIdMiddleware)

# Include API Routers
app.include_router(
    ach_transfers_router,
    prefix=f"{settings.API_V1_STR}/ach/transfers",
    tags=["ACH Transfers"],
)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
