import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, SessionLocal, seed_data
from server.api.v1.emails import router as emails_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed test data idempotently
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Email Ingestion & AI Categorization API",
    description="Backend service for email ingestion (.eml, .msg, .txt), AI classification, and review dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(emails_router, prefix="/api/v1/emails", tags=["emails"])


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "service": "email-ai-classifier"}
