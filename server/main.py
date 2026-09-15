import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.database import SessionLocal, init_db, seed_data, get_db, verify_password
from server.models import User
from server.schemas import LoginRequest, TokenResponse, UserResponse
from server.middleware.tenant_context import TenantContextMiddleware
from server.middleware.rate_limiter import RateLimiterMiddleware

from server.routers.tenants import router as tenants_router
from server.routers.users import router as users_router
from server.routers.configs import router as configs_router
from server.routers.audit import router as audit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed default data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Tenant Management System API",
    version="1.0.0",
    description="Multi-tenant management platform API for onboarding, RBAC, quotas, and audit logging.",
    lifespan=lifespan,
)

# CORS Middleware (Mandatory for fullstack)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middlewares
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(TenantContextMiddleware)

# Register Routers
app.include_router(tenants_router)
app.include_router(users_router)
app.include_router(configs_router)
app.include_router(audit_router)


@app.get("/healthz", tags=["Health"])
@app.get("/readyz", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "tenant-management-system"}


@app.post("/api/v1/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated"
        )

    user_resp = UserResponse.model_validate(user)
    return TokenResponse(
        access_token=f"fake-jwt-token-for-{user.id}",
        token_type="bearer",
        user=user_resp,
    )
