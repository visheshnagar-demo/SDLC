"""FastAPI Cloud Run Service with Auto-Boot ETL execution for gcs_to_bigquery_viswa.
Listens on PORT (default 8080). Triggers ETL pipeline in a background thread on container startup.
"""
import os
import threading
import logging
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gcs_to_bigquery_viswa_service")

EXECUTION_STATUS = {"status": "INITIALIZING", "message": "ETL pipeline starting..."}

def _execute_etl_task():
    global EXECUTION_STATUS
    EXECUTION_STATUS = {"status": "RUNNING", "message": "ETL pipeline is executing..."}
    try:
        from pipeline.run_gcs_to_bigquery_viswa import PipelineRunner
        runner = PipelineRunner()
        records = runner.extract()
        if records > 0:
            runner.load()
        from datetime import datetime, timezone
        EXECUTION_STATUS = {
            "status": "SUCCESS",
            "pipeline_id": "gcs_to_bigquery_viswa",
            "records_processed": records,
            "last_run": datetime.now(timezone.utc).isoformat(),
            "error": None,
        }
        logger.info("Auto-Boot ETL completed successfully. Records: %s", records)
    except Exception as exc:
        logger.error("Auto-Boot ETL failed: %s", exc, exc_info=True)
        EXECUTION_STATUS = {"status": "FAILED", "error": str(exc)}

@asynccontextmanager
async def lifespan(app_instance):
    """Auto-Boot: start ETL in background thread immediately on container startup."""
    t = threading.Thread(target=_execute_etl_task, daemon=True, name="etl-auto-boot")
    t.start()
    yield

try:
    from fastapi import FastAPI, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(
        title="gcs_to_bigquery_viswa ETL Service",
        version="1.0.0",
        description="GCS to BigQuery ETL pipeline auto-boot service. Executes ETL on startup.",
        lifespan=lifespan,
    )

    origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    @app.get("/status")
    def get_status():
        return EXECUTION_STATUS

    @app.post("/run")
    @app.post("/api/v1/etl/run")
    def trigger_etl(background_tasks: BackgroundTasks):
        background_tasks.add_task(_execute_etl_task)
        return {"status": "ACCEPTED", "message": "ETL pipeline execution triggered."}

except ImportError:
    app = None

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("server.main:app", host="0.0.0.0", port=port, log_level="info")
