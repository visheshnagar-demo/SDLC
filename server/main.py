import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from server.database import init_db
from server.routers import wires


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Commercial Wire Maker-Checker API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wires.router)


@app.get("/")
def root():
    return {"message": "Commercial Wire Maker-Checker API Service", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
