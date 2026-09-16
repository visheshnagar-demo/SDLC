import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db
from server.routers.wires import router as wires_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    init_db()
    yield


app = FastAPI(
    title="Commercial Wire Maker-Checker API",
    description="Backend service enforcing dual approval and Maker-Checker segregation for commercial wire transfers.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware for full-stack integration
raw_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register wire transfer routers
app.include_router(wires_router, prefix="/api/wires", tags=["Wires"])
app.include_router(wires_router, prefix="/api/v1/wires", tags=["Wires v1"])


@app.get("/health", tags=["Health"])
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Commercial Wire Maker-Checker System"}
