import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db
from server.api.v1.emails import router as emails_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield


app = FastAPI(
    title="Email Classification System API",
    description="Backend service for automated AI email parsing, classification, and review.",
    version="1.0.0",
    lifespan=lifespan,
)

# Mandatory CORS setup for Fullstack
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

app.include_router(emails_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "Email Classification System"}


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Email Classification System API",
        "docs_url": "/docs",
    }
