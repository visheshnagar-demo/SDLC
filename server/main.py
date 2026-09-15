import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.app.api.v1.emails import router as emails_router
from server.database import SessionLocal, init_db, seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Email Classification System API",
    description="Intelligent email parsing, multi-category AI classification (Work, Personal, Urgent, Promotional), and review management API.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(emails_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "email-classification-system",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.main.py:app", host="0.0.0.0", port=8000, reload=True)
