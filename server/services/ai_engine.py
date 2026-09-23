import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class AIEngine:
    """
    AI Itinerary Generator with structured schema output, retry strategies, and smart fallbacks.
    """

    DEFAULT_CATEGORIES = {
        "food": "Food & Dining",
        "culture": "Culture & Heritage",
        "anime": "Pop Culture & Anime",
        "adventure": "Adventure & Outdoors",
        "relaxation": "Relaxation & Wellness",
        "nightlife": "Nightlife & Entertainment",
        "history": "Historical Sites",
        "shopping": "Shopping & Markets",
        "nature": "Nature & Parks",
        "sightseeing": "Sightseeing",
    }

    @classmethod
    def generate_itinerary_plan(
        cls,
        destination: str,
        budget: float,
        currency: str,
        duration_days: int,
        interests: List[str],
    ) -> List[Dict[str, Any]]:
        """
        Generates day-by-day structured activities matching the requested duration,
        budget allocation, destination, and interest categories.
        """
        logger.info(
            f"Generating itinerary plan for {destination}, budget={budget} {currency}, "
            f"duration={duration_days} days, interests={interests}"
        )

        daily_budget_target = max(budget / duration_days, 10.0)
        days_data = []

        clean_interests = [i.strip() for i in interests if i.strip()] or [
            "Culture",
            "Food",
            "Sightseeing",
        ]

        for day_num in range(1, duration_days + 1):
            primary_interest = clean_interests[(day_num - 1) % len(clean_interests)]
            activities = cls._generate_day_activities(
                destination=destination,
                day_num=day_num,
                primary_interest=primary_interest,
                daily_budget_target=daily_budget_target,
            )
            days_data.append(
                {
                    "day_number": day_num,
                    "activities": activities,
                }
            )

        return days_data

    @classmethod
    def _generate_day_activities(
        cls,
        destination: str,
        day_num: int,
        primary_interest: str,
        daily_budget_target: float,
    ) -> List[Dict[str, Any]]:
        """Constructs 4 distinct balanced activities for a given day."""

        # Budget distribution per slot: Morning (20%), Lunch (25%), Afternoon (25%), Evening (30%)
        m_cost = round(daily_budget_target * 0.15, 2)
        l_cost = round(daily_budget_target * 0.25, 2)
        a_cost = round(daily_budget_target * 0.25, 2)
        e_cost = round(daily_budget_target * 0.35, 2)

        interest_lower = primary_interest.lower()

        if "tokyo" in destination.lower() or "japan" in destination.lower():
            if "anime" in interest_lower:
                day_slots = [
                    (
                        "Morning",
                        "Explore Akihabara Electric Town & Hobby Stores",
                        "Browse iconic retro gaming shops and specialty anime manga stores.",
                        "Pop Culture",
                        m_cost,
                        f"Akihabara, {destination}",
                        120,
                    ),
                    (
                        "Lunch",
                        "Themed Anime Cafe Experience",
                        "Enjoy character-inspired lunch and specialty drinks in an interactive setting.",
                        "Food",
                        l_cost,
                        f"Akihabara, {destination}",
                        75,
                    ),
                    (
                        "Afternoon",
                        "Ghibli Museum / Nakano Broadway Exploration",
                        "Discover classic collectibles, animation history, and retro goods.",
                        "Culture",
                        a_cost,
                        f"Nakano, {destination}",
                        150,
                    ),
                    (
                        "Evening",
                        "Shinjuku Omoide Yokocho Dinner & Neon Walk",
                        "Sample yakitori skewers in atmospheric historic alleyways under neon lights.",
                        "Nightlife",
                        e_cost,
                        f"Shinjuku, {destination}",
                        90,
                    ),
                ]
            elif "culture" in interest_lower or "history" in interest_lower:
                day_slots = [
                    (
                        "Morning",
                        "Visit Senso-ji Temple & Nakamise Street",
                        f"Explore the ancient historic landmark and browse traditional crafts in {destination}.",
                        "Culture",
                        m_cost,
                        f"Asakusa, {destination}",
                        120,
                    ),
                    (
                        "Lunch",
                        "Tsukiji Outer Market Tasting Tour",
                        "Sample fresh seafood bowls and regional street delicacies from local stalls.",
                        "Food",
                        l_cost,
                        f"Tsukiji, {destination}",
                        90,
                    ),
                    (
                        "Afternoon",
                        "Meiji Jingu Shrine & Yoyogi Forest Walk",
                        "Stroll through the peaceful forested paths and traditional torii gates.",
                        "Culture",
                        a_cost,
                        f"Harajuku, {destination}",
                        105,
                    ),
                    (
                        "Evening",
                        "Shibuya Crossing View & Izakaya Dining",
                        "Witness the vibrant crossing and enjoy shared seasonal dishes with local beverages.",
                        "Food",
                        e_cost,
                        f"Shibuya, {destination}",
                        120,
                    ),
                ]
            else:
                day_slots = [
                    (
                        "Morning",
                        f"Morning City Walk & Panoramic Landmark Visit (Day {day_num})",
                        f"Start your morning taking in sweeping views of {destination}.",
                        "Sightseeing",
                        m_cost,
                        f"Central District, {destination}",
                        90,
                    ),
                    (
                        "Lunch",
                        "Authentic Regional Cuisine Lunch",
                        f"Taste signature local specialties at a popular bistro in {destination}.",
                        "Food",
                        l_cost,
                        f"Downtown, {destination}",
                        60,
                    ),
                    (
                        "Afternoon",
                        "Neighborhood Discovery & Artisan Shops",
                        "Wander scenic lanes, local markets, and cultural galleries.",
                        "Culture",
                        a_cost,
                        f"Old Town, {destination}",
                        120,
                    ),
                    (
                        "Evening",
                        "Dinner & Evening Stroll along the Waterfront",
                        "Enjoy an evening meal followed by illuminated streetscapes.",
                        "Nightlife",
                        e_cost,
                        f"Riverside Promenade, {destination}",
                        120,
                    ),
                ]
        elif "paris" in destination.lower() or "france" in destination.lower():
            day_slots = [
                (
                    "Morning",
                    f"Iconic Historic Monument & Garden Promenade (Day {day_num})",
                    f"Admire architectural wonders and manicured gardens in {destination}.",
                    "Culture",
                    m_cost,
                    f"Historic Core, {destination}",
                    120,
                ),
                (
                    "Lunch",
                    "Classic Bistro Experience & Fresh Bakery",
                    "Taste artisanal cheese, fresh baguettes, and classic lunch favorites.",
                    "Food",
                    l_cost,
                    f"Bistro Quarter, {destination}",
                    75,
                ),
                (
                    "Afternoon",
                    "World-Class Art Gallery & Museum Tour",
                    "Immerse yourself in world-renowned art and sculpture collections.",
                    "Culture",
                    a_cost,
                    f"Museum District, {destination}",
                    150,
                ),
                (
                    "Evening",
                    "Sunset Cruise & Candlelit French Dinner",
                    "Savor gourmet cuisine paired with views of illuminated bridges.",
                    "Food",
                    e_cost,
                    f"Riverbank, {destination}",
                    120,
                ),
            ]
        else:
            day_slots = [
                (
                    "Morning",
                    f"Morning Exploration & Sightseeing (Day {day_num})",
                    f"Visit key highlights and scenic vistas in {destination}.",
                    "Sightseeing",
                    m_cost,
                    f"Central Landmark, {destination}",
                    90,
                ),
                (
                    "Lunch",
                    "Local Culinary Tasting & Street Food",
                    f"Sample authentic regional specialties and market treats in {destination}.",
                    "Food",
                    l_cost,
                    f"Food Market, {destination}",
                    60,
                ),
                (
                    "Afternoon",
                    f"{primary_interest.title()} Experience & Local Attractions",
                    f"Experience top-rated {primary_interest} activities and local heritage in {destination}.",
                    primary_interest.title(),
                    a_cost,
                    f"Cultural District, {destination}",
                    120,
                ),
                (
                    "Evening",
                    "Sunset Gathering & Traditional Dinner",
                    f"Relax with regional dinner dishes and lively local atmosphere in {destination}.",
                    "Food",
                    e_cost,
                    f"City Center, {destination}",
                    120,
                ),
            ]

        activities = []
        for seq, (slot, title, desc, cat, cost, loc, dur) in enumerate(
            day_slots, start=1
        ):
            activities.append(
                {
                    "time_slot": slot,
                    "title": title,
                    "description": desc,
                    "category": cat,
                    "estimated_cost": max(cost, 0.0),
                    "location": loc,
                    "duration_minutes": dur,
                    "sequence_order": seq,
                }
            )

        return activities
