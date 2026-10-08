"""ETL Service API and CLI Orchestration Entrypoint."""
import os
import sys
import time
import uuid
import logging
import argparse
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from server.schemas.etl_schemas import (
    ETLRunRequest,
    ETLRunResponse,
    ETLHealthResponse,
)
from server.extractor import PostgresExtractor
from server.transformer import DataTransformer
from server.loader import BigQueryLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("server.main")

app = FastAPI(
    title="Cloud SQL PostgreSQL to BigQuery ETL Service",
    description="Automated batch extraction, data sanitization, and BigQuery ingestion.",
    version="1.0.0",
)

# Constitutional CORS Configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_pipeline(
    write_disposition: str = "WRITE_APPEND",
    batch_size: int = 5000,
    force_full_refresh: bool = False,
) -> ETLRunResponse:
    """Coordinates the end-to-end extraction, transformation, and BigQuery load."""
    start_time = time.time()
    batch_id = str(uuid.uuid4())
    logger.info(
        "Starting ETL Pipeline run (batch_id=%s, write_disposition=%s, batch_size=%d)",
        batch_id,
        write_disposition,
        batch_size,
    )

    extractor = PostgresExtractor()
    transformer = DataTransformer(batch_id=batch_id)
    loader = BigQueryLoader()

    try:
        raw_records = extractor.extract_records(limit=batch_size if not force_full_refresh else None)
        extracted_count = len(raw_records)

        cleaned_records, dead_letter_records = transformer.transform_records(raw_records)
        cleaned_count = len(cleaned_records)
        rejected_count = len(dead_letter_records)

        # Circuit breaker: abort if records extracted but all failed
        if extracted_count > 0 and cleaned_count == 0:
            raise RuntimeError(
                f"Circuit breaker triggered: 100% of {extracted_count} records were rejected as invalid."
            )

        loaded_count = 0
        if cleaned_count > 0:
            target_disposition = "WRITE_TRUNCATE" if force_full_refresh else write_disposition
            loaded_count = loader.load_records(cleaned_records, write_disposition=target_disposition)

        duration = round(time.time() - start_time, 2)
        logger.info(
            "ETL Pipeline completed successfully in %.2fs (extracted=%d, cleaned=%d, rejected=%d, loaded=%d)",
            duration,
            extracted_count,
            cleaned_count,
            rejected_count,
            loaded_count,
        )

        return ETLRunResponse(
            status="SUCCESS",
            batch_id=batch_id,
            records_extracted=extracted_count,
            records_cleaned=cleaned_count,
            records_rejected=rejected_count,
            records_loaded=loaded_count,
            target_table=f"{loader.dataset_id}.{loader.table_id}",
            duration_seconds=duration,
        )
    except Exception as e:
        duration = round(time.time() - start_time, 2)
        logger.error("ETL Pipeline execution failed: %s", e, exc_info=True)
        raise RuntimeError(f"ETL Execution Failed: {str(e)}") from e


@app.post("/api/v1/etl/run", response_model=ETLRunResponse, status_code=status.HTTP_200_OK)
def trigger_etl(request: Optional[ETLRunRequest] = None):
    """Triggers an on-demand execution of the ETL pipeline."""
    req = request or ETLRunRequest()
    try:
        return run_pipeline(
            write_disposition=req.write_disposition,
            batch_size=req.batch_size,
            force_full_refresh=req.force_full_refresh,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/api/v1/etl/health", response_model=ETLHealthResponse, status_code=status.HTTP_200_OK)
def get_health():
    """Health check endpoint evaluating source and destination connectivity."""
    extractor = PostgresExtractor()
    loader = BigQueryLoader()

    source_ok = extractor.check_connection()
    target_ok = loader.check_connection()
    overall_status = "HEALTHY" if (source_ok and target_ok) else "DEGRADED"

    return ETLHealthResponse(
        status=overall_status,
        source_connected=source_ok,
        target_connected=target_ok,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PostgreSQL to BigQuery ETL Service")
    parser.add_argument("--run-etl", action="store_true", help="Execute ETL pipeline as batch CLI job")
    parser.add_argument("--write-disposition", type=str, default="WRITE_APPEND", choices=["WRITE_APPEND", "WRITE_TRUNCATE", "WRITE_EMPTY"])
    parser.add_argument("--batch-size", type=int, default=5000)
    parser.add_argument("--force-full-refresh", action="store_true")
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.run_etl:
        try:
            result = run_pipeline(
                write_disposition=args.write_disposition,
                batch_size=args.batch_size,
                force_full_refresh=args.force_full_refresh,
            )
            print(result.model_dump_json(indent=2))
            sys.exit(0)
        except Exception as exc:
            logger.critical("Batch run failed: %s", exc)
            sys.exit(1)
    else:
        import uvicorn
        uvicorn.run("server.main:app", host=args.host, port=args.port, reload=False)
