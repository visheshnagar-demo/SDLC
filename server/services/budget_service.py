from sqlalchemy.orm import Session
from server.models import Itinerary, ItineraryDay


class BudgetService:
    @staticmethod
    def recalculate_day_budget(day: ItineraryDay) -> float:
        total = 0.0
        for activity in day.activities:
            total += float(activity.estimated_cost or 0.0)
        day.daily_estimated_cost = round(total, 2)
        return day.daily_estimated_cost

    @staticmethod
    def recalculate_itinerary_budget(itinerary: Itinerary, db: Session) -> Itinerary:
        total = 0.0
        for day in itinerary.days:
            day_total = BudgetService.recalculate_day_budget(day)
            total += day_total

        itinerary.total_estimated_cost = round(total, 2)
        if itinerary.total_estimated_cost > itinerary.budget:
            itinerary.budget_status = "OVER_BUDGET"
        else:
            itinerary.budget_status = "WITHIN_BUDGET"

        db.add(itinerary)
        db.commit()
        db.refresh(itinerary)
        return itinerary
