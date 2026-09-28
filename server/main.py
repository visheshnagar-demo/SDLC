from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from server.core.config import settings
from server.core.database import init_db
from server.api.v1.auth import router as auth_router
from server.api.v1.tracks import router as tracks_router
from server.api.v1.modules import router as modules_router
from server.api.v1.tutorials import router as tutorials_router
from server.api.v1.quizzes import router as quizzes_router
from server.api.v1.progress import router as progress_router
from server.api.v1.bookmarks import router as bookmarks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial curriculum data
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )


# Health check endpoints
@app.get("/healthz", tags=["health"])
@app.get("/livez", tags=["health"])
@app.get("/api/v1/health", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}


@app.get("/", tags=["root"])
def root():
    return {
        "message": "Welcome to AI/ML Concepts Learning Platform API",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
    }


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(tracks_router, prefix=settings.API_V1_STR)
app.include_router(modules_router, prefix=settings.API_V1_STR)
app.include_router(tutorials_router, prefix=settings.API_V1_STR)
app.include_router(quizzes_router, prefix=settings.API_V1_STR)
app.include_router(progress_router, prefix=settings.API_V1_STR)
app.include_router(bookmarks_router, prefix=settings.API_V1_STR)
