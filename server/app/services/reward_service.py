"""Gamification and rewards calculation service."""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.app import models


def calculate_meal_points(
    meal_type: str, items: List[models.MealItem], water_glasses: int
) -> int:
    base_points = {
        "BREAKFAST": 30,
        "LUNCH": 40,
        "DINNER": 50,
        "SNACK": 20,
    }.get(meal_type.upper(), 25)

    water_points = water_glasses * 5
    healthy_item_bonus = 0
    for item in items:
        if item.food_category in ["FRUITS", "VEGGIES"]:
            healthy_item_bonus += int(item.servings * 10)
        elif item.food_category in ["GRAINS", "PROTEINS", "DAIRY"]:
            healthy_item_bonus += int(item.servings * 5)

    return base_points + water_points + healthy_item_bonus


def get_child_badges(db: Session, child_id: str) -> List[Dict[str, Any]]:
    all_badges = db.query(models.Badge).all()
    unlocked_map = {
        cb.badge_id: cb.unlocked_at
        for cb in db.query(models.ChildBadge)
        .filter(models.ChildBadge.child_id == child_id)
        .all()
    }

    result = []
    for b in all_badges:
        is_unlocked = b.id in unlocked_map
        result.append(
            {
                "id": b.id,
                "code": b.code,
                "title": b.title,
                "description": b.description,
                "point_reward": b.point_reward,
                "unlocked": is_unlocked,
                "unlocked_at": unlocked_map.get(b.id),
            }
        )
    return result


def unlock_badge_if_eligible(db: Session, child: models.Child, badge_code: str) -> bool:
    badge = db.query(models.Badge).filter(models.Badge.code == badge_code).first()
    if not badge:
        return False

    existing = (
        db.query(models.ChildBadge)
        .filter(
            models.ChildBadge.child_id == child.id,
            models.ChildBadge.badge_id == badge.id,
        )
        .first()
    )

    if existing:
        return False  # Already unlocked

    # Unlock badge
    child_badge = models.ChildBadge(
        id=str(uuid.uuid4()),
        child_id=child.id,
        badge_id=badge.id,
        unlocked_at=datetime.now(timezone.utc),
    )
    db.add(child_badge)
    child.total_points += badge.point_reward
    db.commit()
    return True


def check_and_update_rewards(
    db: Session, child_id: str, new_meal: models.Meal
) -> Dict[str, Any]:
    child = db.query(models.Child).filter(models.Child.id == child_id).first()
    if not child:
        return {"points_awarded": 0, "active_streak_days": 0, "new_badges_unlocked": []}

    # 1. Calculate & credit meal points
    pts = calculate_meal_points(
        new_meal.meal_type, new_meal.items, new_meal.water_glasses
    )
    child.total_points += pts

    # 2. Update active streak days
    # Count consecutive days with meals
    today = datetime.now(timezone.utc).date()
    consecutive_days = 0
    for day_offset in range(30):
        target_date = today - timedelta(days=day_offset)
        start_dt = datetime.combine(
            target_date, datetime.min.time(), tzinfo=timezone.utc
        )
        end_dt = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)
        meal_count = (
            db.query(models.Meal)
            .filter(
                models.Meal.child_id == child_id,
                models.Meal.logged_at >= start_dt,
                models.Meal.logged_at <= end_dt,
            )
            .count()
        )
        if meal_count > 0:
            consecutive_days += 1
        else:
            if (
                day_offset > 0
            ):  # If no meals today yet, streak from previous days might still be active
                break

    child.active_streak_days = max(consecutive_days, child.active_streak_days, 1)

    new_badges_unlocked = []

    # 3. Check "RAINBOW_PLATE" (all 4 meal types logged today)
    start_of_today = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    todays_meals = (
        db.query(models.Meal)
        .filter(
            models.Meal.child_id == child_id, models.Meal.logged_at >= start_of_today
        )
        .all()
    )
    todays_types = {m.meal_type.upper() for m in todays_meals}
    if {"BREAKFAST", "LUNCH", "DINNER", "SNACK"}.issubset(todays_types):
        if unlock_badge_if_eligible(db, child, "RAINBOW_PLATE"):
            new_badges_unlocked.append("Rainbow Plate (+150 Pts)")

    # 4. Check "VEGGIE_HERO_5" (veggies >= 1 for 5 days or 5 veggie meals)
    veggie_items_count = (
        db.query(models.MealItem)
        .join(models.Meal)
        .filter(
            models.Meal.child_id == child_id, models.MealItem.food_category == "VEGGIES"
        )
        .count()
    )
    if veggie_items_count >= 5 or child.active_streak_days >= 5:
        if unlock_badge_if_eligible(db, child, "VEGGIE_HERO_5"):
            new_badges_unlocked.append("Veggie Hero (+100 Pts)")

    # 5. Check "HYDRATION_MASTER"
    total_water = (
        db.query(func.sum(models.Meal.water_glasses))
        .filter(models.Meal.child_id == child_id)
        .scalar()
        or 0
    )
    if total_water >= 15:
        if unlock_badge_if_eligible(db, child, "HYDRATION_MASTER"):
            new_badges_unlocked.append("Hydration Master (+100 Pts)")

    # 6. Check "FRUIT_FANATIC"
    fruit_servings = (
        db.query(func.sum(models.MealItem.servings))
        .join(models.Meal)
        .filter(
            models.Meal.child_id == child_id, models.MealItem.food_category == "FRUITS"
        )
        .scalar()
        or 0.0
    )
    if fruit_servings >= 10:
        if unlock_badge_if_eligible(db, child, "FRUIT_FANATIC"):
            new_badges_unlocked.append("Fruit Fanatic (+100 Pts)")

    db.commit()
    db.refresh(child)

    return {
        "points_awarded": pts,
        "active_streak_days": child.active_streak_days,
        "new_badges_unlocked": new_badges_unlocked,
    }


def get_child_streak(db: Session, child_id: str) -> Dict[str, Any]:
    child = db.query(models.Child).filter(models.Child.id == child_id).first()
    if not child:
        return {
            "child_id": child_id,
            "active_streak_days": 0,
            "total_points": 0,
            "progress_indicators": {},
        }

    # Calculate today's totals
    today = datetime.now(timezone.utc).date()
    start_today = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    todays_meals = (
        db.query(models.Meal)
        .filter(models.Meal.child_id == child_id, models.Meal.logged_at >= start_today)
        .all()
    )

    fruit_count = 0.0
    veggie_count = 0.0
    water_count = 0
    for m in todays_meals:
        water_count += m.water_glasses
        for item in m.items:
            if item.food_category == "FRUITS":
                fruit_count += item.servings
            elif item.food_category == "VEGGIES":
                veggie_count += item.servings

    return {
        "child_id": child_id,
        "active_streak_days": child.active_streak_days,
        "total_points": child.total_points,
        "progress_indicators": {
            "daily_fruit_target": 3.0,
            "current_fruit_servings": fruit_count,
            "daily_veggie_target": 3.0,
            "current_veggie_servings": veggie_count,
            "daily_water_target": 6,
            "current_water_glasses": water_count,
            "meals_logged_today": len(todays_meals),
        },
    }
