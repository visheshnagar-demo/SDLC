import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db
from server.routers import inmates, cells, visitors, audit, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Prison Management System API",
    description="APIs for inmate management, cell capacity, visitor screening, and audit logging.",
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
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inmates.router)
app.include_router(cells.router)
app.include_router(visitors.router)
app.include_router(audit.router)
app.include_router(auth.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "prison-management-service"}
