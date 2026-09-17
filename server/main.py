"""Main entrypoint for ETL pipeline execution (CLI and HTTP API)."""
import os
import sys
import json
import logging
import argparse
from typing import Optional

from server.etl.extractor import GCSExtractor
from server.etl.transformer import DataTransformer
from server.etl.loader import BigQueryLoader
from server.etl.pipeline import ETLPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.main")

# FastAPI App for Cloud Run / Container deployments
try:
    from fastapi import FastAPI, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(
        title="GCS to BigQuery Analytics ETL Service",
        version="1.0.0",
        description="Extracts data from GCS CSV and loads transformed records into BigQuery dataset analytics.",
    )

    allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
    origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    LATEST_STATUS = {"status": "INITIALIZING", "message": "ETL pipeline starting..."}

    def _execute_etl_task():
        global LATEST_STATUS
        LATEST_STATUS = {"status": "RUNNING", "message": "ETL pipeline is executing..."}
        try:
            pipeline = ETLPipeline()
            res = pipeline.run()
            LATEST_STATUS = res
        except Exception as exc:
            LATEST_STATUS = {"status": "FAILED", "error": str(exc)}

    import threading
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def lifespan(app_instance):
        # Auto-boot: start ETL pipeline in a background thread on container startup
        t = threading.Thread(target=_execute_etl_task, daemon=True, name="etl-auto-boot")
        t.start()
        yield

    # Rebuild app with lifespan for auto-boot
    app = FastAPI(
        title="GCS to BigQuery Analytics ETL Service",
        version="1.0.0",
        description="Extracts data from GCS CSV and loads transformed records into BigQuery dataset analytics.",
        lifespan=lifespan,
    )

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
        return LATEST_STATUS

    @app.post("/api/v1/etl/run")
    @app.post("/run")
    def run_etl(background_tasks: BackgroundTasks):
        background_tasks.add_task(_execute_etl_task)
        return {"status": "ACCEPTED", "message": "ETL execution started in background."}

except ImportError:
    app = None


def run_cli():
    """CLI runner function."""
    parser = argparse.ArgumentParser(description="GCS to BigQuery ETL Data Pipeline")
    parser.add_argument("--bucket", help="GCS bucket name", default=None)
    parser.add_argument("--blob", help="GCS source blob name", default=None)
    parser.add_argument("--project", help="GCP Project ID", default=None)
    parser.add_argument("--dataset", help="BigQuery Dataset ID", default=None)
    parser.add_argument("--table", help="BigQuery Target Table ID", default=None)
    parser.add_argument(
        "--write-disposition",
        help="BigQuery write disposition (WRITE_APPEND, WRITE_TRUNCATE)",
        default="WRITE_APPEND",
    )
    args = parser.parse_args()

    extractor = GCSExtractor(bucket_name=args.bucket, source_blob_name=args.blob)
    transformer = DataTransformer(source_file=extractor.source_uri)
    loader = BigQueryLoader(
        project_id=args.project,
        dataset_id=args.dataset,
        table_id=args.table,
    )

    pipeline = ETLPipeline(
        extractor=extractor,
        transformer=transformer,
        loader=loader,
        write_disposition=args.write_disposition,
    )

    result = pipeline.run()
    print(json.dumps(result, indent=2))
    if result.get("status") != "SUCCESS":
        sys.exit(1)


if __name__ == "__main__":
    run_cli()
