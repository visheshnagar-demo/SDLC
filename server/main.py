import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware
from server.api.v1 import api_v1_router
from server.database import init_db
from server.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
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


@app.exception_handler(StarletteHTTPException)
async def rfc7807_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": f"https://httpstatuses.com/{exc.status_code}",
            "title": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
            "status": exc.status_code,
            "detail": exc.detail,
            "instance": str(request.url),
        },
        media_type="application/problem+json",
    )


@app.exception_handler(RequestValidationError)
async def rfc7807_validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    errors = jsonable_encoder(exc.errors())
    detail_msg = "; ".join(
        [
            f"{'.'.join(str(loc) for loc in err.get('loc', []))}: {err.get('msg', '')}"
            for err in errors
        ]
    )
    return JSONResponse(
        status_code=422,
        content={
            "type": "https://httpstatuses.com/422",
            "title": "Unprocessable Entity",
            "status": 422,
            "detail": detail_msg,
            "invalid_params": errors,
            "instance": str(request.url),
        },
        media_type="application/problem+json",
    )


app.include_router(api_v1_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "payment-gateway-service"}
