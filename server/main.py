from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from server.config import settings
from server.database import init_db, seed_data, SessionLocal
from server.routers import chips, transfers, accounts, audit, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Chips Management System API",
    description="Centralized RESTful API for chip inventory, allocations, transfers, and audit logs.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware setup
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )


# Include Routers
app.include_router(chips.router)
app.include_router(transfers.router)
app.include_router(accounts.router)
app.include_router(audit.router)
app.include_router(analytics.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "Chips Management System API"}


@app.get("/ready", tags=["Health"])
def ready_check():
    return {"status": "ready"}
