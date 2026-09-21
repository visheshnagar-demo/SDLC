import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db
from server.routes.auth import router as auth_router
from server.routes.inmates import router as inmates_router
from server.routes.housing import router as housing_router
from server.routes.movements import router as movements_router
from server.routes.releases import router as releases_router
from server.routes.audit import router as audit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Jail Management System (JMS) - Inmate Intake, Housing, Movement, and Release API",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(inmates_router)
api_v1_router.include_router(housing_router)
api_v1_router.include_router(movements_router)
api_v1_router.include_router(releases_router)
api_v1_router.include_router(audit_router)

app.include_router(api_v1_router)


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": "1.0.0"}
