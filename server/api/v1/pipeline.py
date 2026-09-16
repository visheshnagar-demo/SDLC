import datetime
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from server.database import get_db
from server.pipeline.extractor import extract_raw_sales_orders
from server.pipeline.validator import validate_sales_records
from server.pipeline.transformer import transform_sales_records
from server.pipeline.loader import load_to_bigquery
from server.pipeline.logger import log_pipeline_metrics, log_dropped_record
from server.schemas import PipelineRunRequest, PipelineRunResponse, PipelineMetrics

router = APIRouter(prefix="/pipeline", tags=["ETL Pipeline"])


@router.post("/run", response_model=PipelineRunResponse)
@router.post("/trigger", response_model=PipelineRunResponse)
def trigger_pipeline(
    request: PipelineRunRequest = PipelineRunRequest(),
    db: Session = Depends(get_db),
):
    start_ts = time.time()
    start_time_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    job_id = f"etl-job-{uuid.uuid4()}"

    try:
        # 1. Extraction
        raw_records = extract_raw_sales_orders(
            db=db,
            start_date=request.start_date,
            end_date=request.end_date,
            batch_size=request.batch_size,
        )

        # 2. Validation & Filtering
        valid_records, rejected_records, metrics_dict = validate_sales_records(raw_records)

        # Log dropped records
        for rej in rejected_records:
            log_dropped_record(rej, rej.get("rejection_reason", "UNKNOWN"))

        # 3. Transformation
        transformed_records = transform_sales_records(valid_records)

        # 4. Loading to BigQuery
        loaded_count = load_to_bigquery(transformed_records)
        metrics_dict["loaded_count"] = loaded_count

        end_ts = time.time()
        end_time_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        duration_seconds = round(end_ts - start_ts, 3)

        # 5. Logging summary
        log_pipeline_metrics(metrics_dict, duration_seconds)

        return PipelineRunResponse(
            status="COMPLETED",
            job_id=job_id,
            start_time=start_time_iso,
            end_time=end_time_iso,
            duration_seconds=duration_seconds,
            metrics=PipelineMetrics(**metrics_dict),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(exc)}")
