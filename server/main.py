import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, seed_data
from server.middleware.tenant import TenantRoutingMiddleware
from server.api.tenants import router as tenants_router
from server.api.subscriptions import router as subscriptions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed data
    init_db()
    seed_data()
    yield


app = FastAPI(
    title="Tenant Management System",
    description="Multi-tenant SaaS control plane API for tenant onboarding, routing, subscription tiers, and isolation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware (MANDATORY for fullstack projects)
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

# Add Tenant Context & Routing Middleware
app.add_middleware(TenantRoutingMiddleware)

# Include Routers
app.include_router(tenants_router)
app.include_router(subscriptions_router)


@app.get("/healthz", tags=["health"])
def healthz():
    return {"status": "ok"}


@app.get("/readyz", tags=["health"])
def readyz():
    return {"status": "ready"}
