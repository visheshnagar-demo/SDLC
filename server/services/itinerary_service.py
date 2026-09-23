from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import Itinerary, ItineraryDay, Activity
from server.schemas import (
    ItineraryGenerateRequest,
    ItineraryUpdateRequest,
    ActivityCreateRequest,
    ActivityUpdateRequest,
    ActivityReorderRequest,
)
from server.services.ai_engine import AIEngine
from server.services.budget_service import BudgetService
from server.services.export_service import ExportService


class ItineraryService:
    @staticmethod
    def generate_itinerary(req: ItineraryGenerateRequest, db: Session) -> Itinerary:
        """Generates a complete day-by-day travel plan using AI engine and persists it."""
        if req.duration_days < 1 or req.duration_days > 30:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Duration must be between 1 and 30 days.",
            )
        if req.budget <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Budget must be greater than zero.",
            )

        share_token = ExportService.generate_share_token()

        itinerary = Itinerary(
            destination=req.destination,
            budget=round(req.budget, 2),
            currency=req.currency.upper(),
            duration_days=req.duration_days,
            interests=req.interests,
            user_id=req.user_id,
            share_token=share_token,
            total_estimated_cost=0.0,
            budget_status="WITHIN_BUDGET",
        )
        db.add(itinerary)
        db.flush()

        # Generate days & activities from AI Engine
        days_data = AIEngine.generate_itinerary_plan(
            destination=req.destination,
            budget=req.budget,
            currency=req.currency,
            duration_days=req.duration_days,
            interests=req.interests,
        )

        for d_data in days_data:
            day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=d_data["day_number"],
                daily_estimated_cost=0.0,
            )
            db.add(day)
            db.flush()

            for act_data in d_data["activities"]:
                activity = Activity(
                    day_id=day.id,
                    time_slot=act_data["time_slot"],
                    title=act_data["title"],
                    description=act_data["description"],
                    category=act_data["category"],
                    estimated_cost=round(act_data["estimated_cost"], 2),
                    location=act_data["location"],
                    duration_minutes=act_data["duration_minutes"],
                    sequence_order=act_data["sequence_order"],
                )
                db.add(activity)

        db.flush()
        db.expire_all()
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary.id).first()
        BudgetService.recalculate_itinerary_budget(itinerary, db)
        return itinerary

    @staticmethod
    def get_itinerary_by_id(itinerary_id: str, db: Session) -> Itinerary:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Itinerary with id '{itinerary_id}' not found.",
            )
        return itinerary

    @staticmethod
    def get_itinerary_by_share_token(share_token: str, db: Session) -> Itinerary:
        itinerary = db.query(Itinerary).filter(Itinerary.id == share_token).first()
        if not itinerary:
            itinerary = (
                db.query(Itinerary).filter(Itinerary.share_token == share_token).first()
            )
        if not itinerary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shared itinerary with token '{share_token}' not found.",
            )
        return itinerary

    @staticmethod
    def list_itineraries(skip: int, limit: int, db: Session) -> List[Itinerary]:
        return (
            db.query(Itinerary)
            .order_by(Itinerary.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_itinerary(
        itinerary_id: str, req: ItineraryUpdateRequest, db: Session
    ) -> Itinerary:
        itinerary = ItineraryService.get_itinerary_by_id(itinerary_id, db)

        if req.destination is not None:
            itinerary.destination = req.destination
        if req.budget is not None:
            if req.budget <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Budget must be greater than zero.",
                )
            itinerary.budget = round(req.budget, 2)
        if req.currency is not None:
            itinerary.currency = req.currency.upper()
        if req.interests is not None:
            itinerary.interests = req.interests
        if req.duration_days is not None:
            if req.duration_days < 1 or req.duration_days > 30:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Duration must be between 1 and 30 days.",
                )
            # If duration increased, add missing days
            current_day_count = len(itinerary.days)
            if req.duration_days > current_day_count:
                for d_num in range(current_day_count + 1, req.duration_days + 1):
                    new_day = ItineraryDay(
                        itinerary_id=itinerary.id,
                        day_number=d_num,
                        daily_estimated_cost=0.0,
                    )
                    db.add(new_day)
            elif req.duration_days < current_day_count:
                # Remove days beyond new duration
                for day in list(itinerary.days):
                    if day.day_number > req.duration_days:
                        db.delete(day)
            itinerary.duration_days = req.duration_days

        db.flush()
        db.expire_all()
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        BudgetService.recalculate_itinerary_budget(itinerary, db)
        return itinerary

    @staticmethod
    def add_activity(
        itinerary_id: str, req: ActivityCreateRequest, db: Session
    ) -> Activity:
        itinerary = ItineraryService.get_itinerary_by_id(itinerary_id, db)

        day = None
        if req.day_id:
            day = (
                db.query(ItineraryDay)
                .filter(
                    ItineraryDay.id == req.day_id,
                    ItineraryDay.itinerary_id == itinerary.id,
                )
                .first()
            )
            if not day:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Day with id '{req.day_id}' does not exist in itinerary '{itinerary_id}'.",
                )
        else:
            if not itinerary.days:
                day = ItineraryDay(
                    itinerary_id=itinerary.id,
                    day_number=1,
                    daily_estimated_cost=0.0,
                )
                db.add(day)
                db.flush()
            else:
                day = itinerary.days[0]

        max_seq = max([a.sequence_order for a in day.activities], default=0)
        seq_order = req.sequence_order if req.sequence_order > 1 else max_seq + 1

        activity = Activity(
            day_id=day.id,
            time_slot=req.time_slot,
            title=req.title,
            description=req.description,
            category=req.category,
            estimated_cost=round(req.estimated_cost, 2),
            location=req.location,
            duration_minutes=req.duration_minutes,
            sequence_order=seq_order,
        )
        db.add(activity)
        db.flush()
        db.expire_all()

        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        BudgetService.recalculate_itinerary_budget(itinerary, db)
        db.refresh(activity)
        return activity

    @staticmethod
    def update_activity(
        itinerary_id: str, activity_id: str, req: ActivityUpdateRequest, db: Session
    ) -> Activity:
        itinerary = ItineraryService.get_itinerary_by_id(itinerary_id, db)
        day_ids = [d.id for d in itinerary.days]

        activity = (
            db.query(Activity)
            .filter(
                Activity.id == activity_id,
                Activity.day_id.in_(day_ids),
            )
            .first()
        )

        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Activity '{activity_id}' not found in itinerary '{itinerary_id}'.",
            )

        if req.time_slot is not None:
            activity.time_slot = req.time_slot
        if req.title is not None:
            activity.title = req.title
        if req.description is not None:
            activity.description = req.description
        if req.category is not None:
            activity.category = req.category
        if req.estimated_cost is not None:
            activity.estimated_cost = round(req.estimated_cost, 2)
        if req.location is not None:
            activity.location = req.location
        if req.duration_minutes is not None:
            activity.duration_minutes = req.duration_minutes
        if req.sequence_order is not None:
            activity.sequence_order = req.sequence_order

        db.flush()
        db.expire_all()
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        BudgetService.recalculate_itinerary_budget(itinerary, db)
        db.refresh(activity)
        return activity

    @staticmethod
    def delete_activity(itinerary_id: str, activity_id: str, db: Session) -> Itinerary:
        itinerary = ItineraryService.get_itinerary_by_id(itinerary_id, db)
        day_ids = [d.id for d in itinerary.days]

        activity = (
            db.query(Activity)
            .filter(
                Activity.id == activity_id,
                Activity.day_id.in_(day_ids),
            )
            .first()
        )

        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Activity '{activity_id}' not found in itinerary '{itinerary_id}'.",
            )

        db.delete(activity)
        db.flush()
        db.expire_all()
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        BudgetService.recalculate_itinerary_budget(itinerary, db)
        return itinerary

    @staticmethod
    def reorder_activities(
        itinerary_id: str, req: ActivityReorderRequest, db: Session
    ) -> Itinerary:
        itinerary = ItineraryService.get_itinerary_by_id(itinerary_id, db)
        day_map = {d.id: d for d in itinerary.days}

        for item in req.activities:
            if item.day_id not in day_map:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Target day '{item.day_id}' does not belong to itinerary '{itinerary_id}'.",
                )
            activity = (
                db.query(Activity).filter(Activity.id == item.activity_id).first()
            )
            if not activity or activity.day_id not in day_map:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Activity '{item.activity_id}' not found in itinerary '{itinerary_id}'.",
                )
            activity.day_id = item.day_id
            activity.sequence_order = item.sequence_order

        db.flush()
        db.expire_all()
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        BudgetService.recalculate_itinerary_budget(itinerary, db)
        return itinerary
