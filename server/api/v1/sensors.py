from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.database import get_db
from server import schemas
from server.services import rainwater_service

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.post(
    "/telemetry",
    response_model=schemas.TelemetryResponse,
    status_code=status.HTTP_201_CREATED,
)
def ingest_telemetry(
    telemetry_in: schemas.TelemetryIngest, db: Session = Depends(get_db)
):
    telemetry_log, _ = rainwater_service.process_telemetry(db, telemetry_in)
    return telemetry_log
