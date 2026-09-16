import time
import uuid
import threading
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.config import settings
from server.database import get_db, engine, Base
from server.schemas import (
    PipelineRunRequest,
    PipelineRunResponse,
    PipelineMetrics,
    HealthResponse,
)
from server.pipeline.extractor import PostgresExtractor
from server.pipeline.validator import DataValidator
from server.pipeline.transformer import DataTransformer
from server.pipeline.loader import BigQueryLoader
from server.pipeline.logger import pipeline_logger, log_audit_event


def run_pipeline_job(
    request_params: PipelineRunRequest, db: Session = None
) -> PipelineRunResponse:
    job_id = f"etl-job-{uuid.uuid4()}"
    start_dt = datetime.now(timezone.utc)
    start_time_str = start_dt.isoformat()
    t0 = time.time()

    pipeline_logger.info(f"Starting ETL Pipeline Job {job_id}")

    try:
        extractor = PostgresExtractor(db_session=db)
        raw_records = extractor.extract_records(
            start_date=request_params.start_date,
            end_date=request_params.end_date,
            batch_size=request_params.batch_size,
        )

        valid_records, metrics_dict, quarantined_records = DataValidator.validate_batch(
            raw_records
        )

        transformed_records = DataTransformer.transform_batch(valid_records)

        loader = BigQueryLoader()
        loaded_count = loader.load_records(
            transformed_records, force_reload=request_params.force_reload
        )

        t1 = time.time()
        end_dt = datetime.now(timezone.utc)
        duration = round(t1 - t0, 3)

        metrics = PipelineMetrics(
            extracted_count=metrics_dict["extracted_count"],
            filtered_missing_amount=metrics_dict["filtered_missing_amount"],
            filtered_invalid_email=metrics_dict["filtered_invalid_email"],
            total_filtered=metrics_dict["total_filtered"],
            loaded_count=loaded_count,
        )

        log_audit_event(
            "PIPELINE_RUN_COMPLETED",
            {
                "job_id": job_id,
                "duration_seconds": duration,
                "metrics": metrics.model_dump(),
            },
        )

        pipeline_logger.info(
            f"Summary: Extracted={metrics.extracted_count}, Filtered={metrics.total_filtered}, Loaded={metrics.loaded_count}"
        )

        return PipelineRunResponse(
            status="COMPLETED",
            job_id=job_id,
            start_time=start_time_str,
            end_time=end_dt.isoformat(),
            duration_seconds=duration,
            metrics=metrics,
        )
    except Exception as exc:
        pipeline_logger.error(f"ETL Job {job_id} failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution failed: {str(exc)}",
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure local DB tables exist if in SQLite or dev mode
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        pipeline_logger.warning(f"Database table check: {e}")

    # Auto-boot background task execution if enabled
    if settings.AUTO_BOOT_ETL:

        def auto_boot_worker():
            pipeline_logger.info(
                "Auto-Boot ETL hook triggered. Running initial sync..."
            )
            try:
                run_pipeline_job(PipelineRunRequest())
            except Exception as e:
                pipeline_logger.error(f"Auto-Boot ETL failed: {e}")

        t = threading.Thread(target=auto_boot_worker, daemon=True)
        t.start()

    yield


app = FastAPI(
    title="Sales Data ETL Pipeline Service",
    version="1.0.0",
    description="Extracts raw sales orders from PostgreSQL, filters invalid records, and loads partitioned rows into BigQuery.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def root():
    return {
        "service": "Sales Data ETL Pipeline Service",
        "version": "1.0.0",
        "status": "online",
    }


@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    extractor = PostgresExtractor(db_session=db)
    loader = BigQueryLoader()

    db_ok = extractor.check_connection()
    bq_ok = loader.check_connection()

    overall_status = "healthy" if db_ok else "degraded"

    return HealthResponse(
        status=overall_status, database_connected=db_ok, bigquery_accessible=bq_ok
    )


@app.post("/api/v1/pipeline/run", response_model=PipelineRunResponse, tags=["Pipeline"])
def run_pipeline(request_params: PipelineRunRequest, db: Session = Depends(get_db)):
    return run_pipeline_job(request_params, db=db)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server.main:app", host="0.0.0.0", port=settings.PORT, reload=False)
