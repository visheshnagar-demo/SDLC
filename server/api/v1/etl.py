from fastapi import APIRouter, HTTPException
from server.etl_main import run_etl_pipeline, get_latest_status

router = APIRouter(prefix="/etl", tags=["ETL"])


@router.post("/jobs/run")
def trigger_etl_job():
    """Triggers the ETL pipeline batch execution."""
    result = run_etl_pipeline()
    if result.get("status") == "FAILED":
        raise HTTPException(status_code=500, detail=result)
    return {
        "message": "ETL job executed successfully",
        "result": result,
    }


@router.get("/jobs/status")
def get_etl_job_status():
    """Queries the status and metrics of the latest ETL execution."""
    status_info = get_latest_status()
    return status_info
