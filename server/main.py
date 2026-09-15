"""FastAPI web service entry point for ETL pipeline triggering and monitoring."""
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from server.config import settings
from server.etl.runner import ETLRunner
from server.models import ETLRunRequest, ETLRunResponse, PipelineRunResult

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.main")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root info endpoint."""
    return {"message": settings.APP_NAME, "status": "running"}


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}


@app.post(
    f"{settings.API_V1_PREFIX}/etl/run",
    response_model=ETLRunResponse,
    status_code=status.HTTP_200_OK,
)
def trigger_etl_run(payload: ETLRunRequest = ETLRunRequest()):
    """Triggers execution of the PostgreSQL to BigQuery sales ETL pipeline."""
    logger.info("Received request to trigger ETL pipeline. dry_run=%s", payload.dry_run)
    try:
        runner = ETLRunner()
        result: PipelineRunResult = runner.run(dry_run=payload.dry_run or False)

        if result.status == "FAILED":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ETL pipeline run failed: {result.error_message}",
            )

        return ETLRunResponse(
            success=True,
            data=result,
            message="ETL pipeline run executed successfully.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Unhandled exception during ETL execution: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution error: {str(exc)}",
        )
