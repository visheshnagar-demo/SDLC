import uuid
import secrets
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from server.models import Itinerary, ItineraryDay, Activity
from server.schemas import (
    ItineraryGenerateRequest,
    ItineraryUpdateRequest,
    ActivityCreate,
    ActivityUpdate,
    ActivityReorderRequest,
)
from server.services.ai_engine import AIEngine
from server.services.budget_service import BudgetService


class ItineraryService:
    @staticmethod
    def generate_itinerary(req: ItineraryGenerateRequest, db: Session) -> Itinerary:
        # 1. Create Itinerary with initial share_token
        itinerary = Itinerary(
            id=str(uuid.uuid4()),
            destination=req.destination,
            budget=req.budget,
            currency=req.currency or "USD",
            duration_days=req.duration_days,
            interests=req.interests or [],
            total_estimated_cost=0.0,
            budget_status="WITHIN_BUDGET",
            share_token=secrets.token_urlsafe(16),
        )
        db.add(itinerary)
        db.flush()

        # 2. Generate Day plans from AI Engine
        days_plan = AIEngine.generate_plan(
            destination=req.destination,
            budget=req.budget,
            duration_days=req.duration_days,
            interests=req.interests,
        )

        for plan in days_plan:
            day = ItineraryDay(
                id=str(uuid.uuid4()),
                itinerary_id=itinerary.id,
                day_number=plan["day_number"],
                date=None,
                daily_estimated_cost=0.0,
            )
            db.add(day)
            db.flush()

            for act_data in plan["activities"]:
                activity = Activity(
                    id=str(uuid.uuid4()),
                    day_id=day.id,
                    time_slot=act_data["time_slot"],
                    title=act_data["title"],
                    description=act_data["description"],
                    category=act_data["category"],
                    estimated_cost=act_data["estimated_cost"],
                    location=act_data.get("location", ""),
                    duration_minutes=act_data.get("duration_minutes", 60),
                    sequence_order=act_data.get("sequence_order", 0),
                )
                db.add(activity)

        db.commit()
        db.refresh(itinerary)
        # Recalculate and update status
        return BudgetService.recalculate_itinerary_budget(itinerary, db)

    @staticmethod
    def get_itinerary(itinerary_id: str, db: Session) -> Optional[Itinerary]:
        return db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()

    @staticmethod
    def list_itineraries(skip: int, limit: int, db: Session) -> List[Itinerary]:
        return db.query(Itinerary).offset(skip).limit(limit).all()

    @staticmethod
    def update_itinerary(
        itinerary_id: str, req: ItineraryUpdateRequest, db: Session
    ) -> Optional[Itinerary]:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            return None

        if req.destination is not None:
            itinerary.destination = req.destination
        if req.budget is not None:
            itinerary.budget = req.budget
        if req.currency is not None:
            itinerary.currency = req.currency
        if req.duration_days is not None:
            itinerary.duration_days = req.duration_days
        if req.interests is not None:
            itinerary.interests = req.interests

        db.add(itinerary)
        db.commit()
        db.refresh(itinerary)
        return BudgetService.recalculate_itinerary_budget(itinerary, db)

    @staticmethod
    def get_shared_itinerary(share_token: str, db: Session) -> Optional[Itinerary]:
        return db.query(Itinerary).filter(Itinerary.share_token == share_token).first()

    @staticmethod
    def add_activity(itinerary_id: str, req: ActivityCreate, db: Session) -> Activity:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")

        # Find target day
        day = None
        if req.day_id:
            day = (
                db.query(ItineraryDay)
                .filter(
                    ItineraryDay.id == req.day_id,
                    ItineraryDay.itinerary_id == itinerary_id,
                )
                .first()
            )
        elif req.day_number is not None:
            day = (
                db.query(ItineraryDay)
                .filter(
                    ItineraryDay.day_number == req.day_number,
                    ItineraryDay.itinerary_id == itinerary_id,
                )
                .first()
            )

        if not day:
            if itinerary.days:
                day = itinerary.days[0]
            else:
                day = ItineraryDay(
                    id=str(uuid.uuid4()),
                    itinerary_id=itinerary.id,
                    day_number=1,
                    daily_estimated_cost=0.0,
                )
                db.add(day)
                db.flush()

        seq = req.sequence_order
        if seq is None or seq == 0:
            seq = len(day.activities)

        activity = Activity(
            id=str(uuid.uuid4()),
            day_id=day.id,
            time_slot=req.time_slot,
            title=req.title,
            description=req.description,
            category=req.category,
            estimated_cost=req.estimated_cost,
            location=req.location or "",
            duration_minutes=req.duration_minutes or 60,
            sequence_order=seq,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)

        BudgetService.recalculate_itinerary_budget(itinerary, db)
        return activity

    @staticmethod
    def update_activity(
        itinerary_id: str, activity_id: str, req: ActivityUpdate, db: Session
    ) -> Optional[Activity]:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            return None

        activity = (
            db.query(Activity)
            .join(ItineraryDay)
            .filter(
                Activity.id == activity_id, ItineraryDay.itinerary_id == itinerary_id
            )
            .first()
        )
        if not activity:
            return None

        if req.time_slot is not None:
            activity.time_slot = req.time_slot
        if req.title is not None:
            activity.title = req.title
        if req.description is not None:
            activity.description = req.description
        if req.category is not None:
            activity.category = req.category
        if req.estimated_cost is not None:
            activity.estimated_cost = req.estimated_cost
        if req.location is not None:
            activity.location = req.location
        if req.duration_minutes is not None:
            activity.duration_minutes = req.duration_minutes
        if req.sequence_order is not None:
            activity.sequence_order = req.sequence_order

        db.add(activity)
        db.commit()
        db.refresh(activity)

        BudgetService.recalculate_itinerary_budget(itinerary, db)
        return activity

    @staticmethod
    def delete_activity(
        itinerary_id: str, activity_id: str, db: Session
    ) -> Optional[Dict[str, Any]]:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            return None

        activity = (
            db.query(Activity)
            .join(ItineraryDay)
            .filter(
                Activity.id == activity_id, ItineraryDay.itinerary_id == itinerary_id
            )
            .first()
        )
        if not activity:
            return None

        db.delete(activity)
        db.commit()

        BudgetService.recalculate_itinerary_budget(itinerary, db)
        remaining = round(itinerary.budget - itinerary.total_estimated_cost, 2)
        return {
            "message": "Activity deleted successfully",
            "total_estimated_cost": itinerary.total_estimated_cost,
            "remaining_budget": remaining,
            "budget_status": itinerary.budget_status,
        }

    @staticmethod
    def reorder_activities(
        itinerary_id: str, req: ActivityReorderRequest, db: Session
    ) -> Itinerary:
        itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")

        if req.activities:
            for item in req.activities:
                act = (
                    db.query(Activity)
                    .join(ItineraryDay)
                    .filter(
                        Activity.id == item.activity_id,
                        ItineraryDay.itinerary_id == itinerary_id,
                    )
                    .first()
                )
                if act:
                    act.sequence_order = item.sequence_order
                    if item.day_id:
                        act.day_id = item.day_id
                    db.add(act)
        elif req.activity_ids:
            for idx, act_id in enumerate(req.activity_ids):
                act = (
                    db.query(Activity)
                    .join(ItineraryDay)
                    .filter(
                        Activity.id == act_id, ItineraryDay.itinerary_id == itinerary_id
                    )
                    .first()
                )
                if act:
                    act.sequence_order = idx
                    if req.day_id:
                        act.day_id = req.day_id
                    db.add(act)

        db.commit()
        db.refresh(itinerary)
        return BudgetService.recalculate_itinerary_budget(itinerary, db)
