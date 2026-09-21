from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.api_schema import APICreate, APIUpdate, APIDetail
from server.schemas.health_log_schema import HealthLogResponse
from server.services.api_service import (
    get_all_apis,
    get_api_by_id,
    create_api_record,
    update_api_record,
    delete_api_record,
)
from server.services.health_poller import probe_single_api
from server.services.metrics_service import get_24h_api_stats

router = APIRouter(prefix="/apis", tags=["APIs"])


@router.get("", response_model=List[APIDetail])
def list_apis(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List all registered API endpoints with current operational status and 24h summary stats."""
    apis = get_all_apis(db, skip=skip, limit=limit)
    results = []
    for api_obj in apis:
        api_detail = APIDetail.model_validate(api_obj)
        api_detail.stats_24h = get_24h_api_stats(db, api_obj.id)
        results.append(api_detail)
    return results


@router.post("", response_model=APIDetail, status_code=status.HTTP_201_CREATED)
def register_api(api_in: APICreate, db: Session = Depends(get_db)):
    """Register a new API endpoint for automated health monitoring."""
    api_obj = create_api_record(db, api_in)
    api_detail = APIDetail.model_validate(api_obj)
    api_detail.stats_24h = get_24h_api_stats(db, api_obj.id)
    return api_detail


@router.get("/{api_id}", response_model=APIDetail)
def get_api_details(api_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed configuration and 24-hour telemetry metrics for a monitored API."""
    api_obj = get_api_by_id(db, api_id)
    if not api_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored API with ID '{api_id}' was not found",
        )
    api_detail = APIDetail.model_validate(api_obj)
    api_detail.stats_24h = get_24h_api_stats(db, api_obj.id)
    return api_detail


@router.put("/{api_id}", response_model=APIDetail)
def update_api(api_id: str, api_in: APIUpdate, db: Session = Depends(get_db)):
    """Update API monitoring parameters or toggle active status."""
    api_obj = update_api_record(db, api_id, api_in)
    if not api_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored API with ID '{api_id}' was not found",
        )
    api_detail = APIDetail.model_validate(api_obj)
    api_detail.stats_24h = get_24h_api_stats(db, api_obj.id)
    return api_detail


@router.delete("/{api_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api(api_id: str, db: Session = Depends(get_db)):
    """Delete an API endpoint and cascade delete its historical health logs."""
    deleted = delete_api_record(db, api_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored API with ID '{api_id}' was not found",
        )
    return None


@router.post("/{api_id}/check", response_model=HealthLogResponse)
async def trigger_manual_check(api_id: str, db: Session = Depends(get_db)):
    """Trigger an immediate on-demand health check for an API and return the probe result."""
    api_obj = get_api_by_id(db, api_id)
    if not api_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitored API with ID '{api_id}' was not found",
        )
    log_entry = await probe_single_api(db, api_obj)
    return HealthLogResponse.model_validate(log_entry)
