from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import (
    ActivityCreateRequest,
    ActivityUpdateRequest,
    ActivityResponse,
    ActivityReorderRequest,
    ItineraryResponse,
    BudgetSummaryResponse,
)
from server.services.itinerary_service import ItineraryService

router = APIRouter()


@router.post(
    "/{id}/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Custom Activity to Itinerary",
)
def add_activity(
    id: str,
    req: ActivityCreateRequest,
    db: Session = Depends(get_db),
):
    return ItineraryService.add_activity(itinerary_id=id, req=req, db=db)


@router.put(
    "/{id}/activities/{activity_id}",
    response_model=ActivityResponse,
    summary="Edit Existing Activity",
)
def update_activity(
    id: str,
    activity_id: str,
    req: ActivityUpdateRequest,
    db: Session = Depends(get_db),
):
    return ItineraryService.update_activity(
        itinerary_id=id, activity_id=activity_id, req=req, db=db
    )


@router.delete(
    "/{id}/activities/{activity_id}",
    response_model=BudgetSummaryResponse,
    summary="Delete Activity and Recalculate Budget",
)
def delete_activity(
    id: str,
    activity_id: str,
    db: Session = Depends(get_db),
):
    updated_itinerary = ItineraryService.delete_activity(
        itinerary_id=id, activity_id=activity_id, db=db
    )
    remaining = round(
        updated_itinerary.budget - updated_itinerary.total_estimated_cost, 2
    )
    return BudgetSummaryResponse(
        total_estimated_cost=updated_itinerary.total_estimated_cost,
        budget=updated_itinerary.budget,
        currency=updated_itinerary.currency,
        budget_status=updated_itinerary.budget_status,
        remaining_budget=remaining,
    )


@router.post(
    "/{id}/activities/reorder",
    response_model=ItineraryResponse,
    summary="Reorder Activities Within or Across Days",
)
def reorder_activities(
    id: str,
    req: ActivityReorderRequest,
    db: Session = Depends(get_db),
):
    return ItineraryService.reorder_activities(itinerary_id=id, req=req, db=db)
