from sqlalchemy.orm import Session
from server.models import Itinerary, ItineraryDay, Activity


class BudgetService:
    @staticmethod
    def recalculate_day_budget(day: ItineraryDay, db: Session) -> float:
        """Calculate total estimated cost for a single day."""
        activities = db.query(Activity).filter(Activity.day_id == day.id).all()
        daily_total = sum(act.estimated_cost for act in activities)
        day.daily_estimated_cost = round(daily_total, 2)
        return day.daily_estimated_cost

    @staticmethod
    def recalculate_itinerary_budget(itinerary: Itinerary, db: Session) -> float:
        """Recalculate all days and total itinerary cost, updating budget status."""
        total = 0.0
        for day in itinerary.days:
            daily_total = BudgetService.recalculate_day_budget(day, db)
            total += daily_total

        itinerary.total_estimated_cost = round(total, 2)
        if itinerary.total_estimated_cost <= itinerary.budget:
            itinerary.budget_status = "WITHIN_BUDGET"
        else:
            itinerary.budget_status = "OVER_BUDGET"

        db.commit()
        db.refresh(itinerary)
        return itinerary.total_estimated_cost
