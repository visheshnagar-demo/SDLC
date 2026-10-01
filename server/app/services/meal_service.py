"""Meal logging and nutrition aggregation service."""

import uuid
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from server.app import models, schemas
from server.app.services import reward_service


def log_meal(db: Session, req: schemas.MealCreateRequest) -> schemas.MealCreateResponse:
    child = db.query(models.Child).filter(models.Child.id == req.child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Child profile with id {req.child_id} not found.",
        )

    logged_time = req.logged_at or datetime.now(timezone.utc)
    # Ensure timezone aware
    if logged_time.tzinfo is None:
        logged_time = logged_time.replace(tzinfo=timezone.utc)

    meal = models.Meal(
        id=str(uuid.uuid4()),
        child_id=req.child_id,
        meal_type=req.meal_type.upper(),
        water_glasses=req.water_glasses,
        logged_at=logged_time,
        created_at=datetime.now(timezone.utc),
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)

    meal_items = []
    for item in req.items:
        m_item = models.MealItem(
            id=str(uuid.uuid4()),
            meal_id=meal.id,
            food_name=item.food_name,
            food_category=item.food_category.upper(),
            servings=item.servings,
        )
        db.add(m_item)
        meal_items.append(m_item)

    db.commit()
    db.refresh(meal)

    # Calculate rewards and streak
    reward_result = reward_service.check_and_update_rewards(db, req.child_id, meal)

    # Calculate today's totals
    today = logged_time.date()
    start_today = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    end_today = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
    todays_meals = (
        db.query(models.Meal)
        .filter(
            models.Meal.child_id == req.child_id,
            models.Meal.logged_at >= start_today,
            models.Meal.logged_at <= end_today,
        )
        .all()
    )

    fruit_total = 0.0
    veggie_total = 0.0
    grain_total = 0.0
    protein_total = 0.0
    dairy_total = 0.0
    water_total = 0

    for m in todays_meals:
        water_total += m.water_glasses
        for it in m.items:
            cat = it.food_category.upper()
            if cat == "FRUITS":
                fruit_total += it.servings
            elif cat == "VEGGIES":
                veggie_total += it.servings
            elif cat == "GRAINS":
                grain_total += it.servings
            elif cat == "PROTEINS":
                protein_total += it.servings
            elif cat == "DAIRY":
                dairy_total += it.servings

    return schemas.MealCreateResponse(
        meal=schemas.MealResponse.model_validate(meal),
        points_awarded=reward_result["points_awarded"],
        active_streak_days=reward_result["active_streak_days"],
        new_badges_unlocked=reward_result["new_badges_unlocked"],
        daily_fruit_servings=round(fruit_total, 2),
        daily_veggie_servings=round(veggie_total, 2),
        daily_grain_servings=round(grain_total, 2),
        daily_protein_servings=round(protein_total, 2),
        daily_dairy_servings=round(dairy_total, 2),
        daily_water_glasses=water_total,
    )


def get_meals_for_child(
    db: Session, child_id: str, target_date: Optional[str] = None
) -> List[models.Meal]:
    query = db.query(models.Meal).filter(models.Meal.child_id == child_id)
    if target_date:
        try:
            parsed_date = date.fromisoformat(target_date)
            start_dt = datetime.combine(
                parsed_date, datetime.min.time(), tzinfo=timezone.utc
            )
            end_dt = datetime.combine(
                parsed_date, datetime.max.time(), tzinfo=timezone.utc
            )
            query = query.filter(
                models.Meal.logged_at >= start_dt, models.Meal.logged_at <= end_dt
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Expected YYYY-MM-DD.",
            )

    return query.order_by(models.Meal.logged_at.desc()).all()
