from fastapi import APIRouter
from server.pipeline.loader import check_bigquery_connection
from server.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_status():
    bq_ok = check_bigquery_connection()
    return HealthResponse(
        status="healthy",
        database_connected=True,
        bigquery_accessible=bq_ok,
    )
