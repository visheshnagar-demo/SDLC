import random
from typing import List, Dict, Any


class AIEngine:
    SAMPLE_ACTIVITIES = {
        "Culture": [
            (
                "Historical City Walking Tour",
                "Explore ancient monuments and learn about local heritage.",
                0.0,
                "Old Town",
                120,
            ),
            (
                "Famous Museum & Art Gallery Visit",
                "Guided tour through renowned historical exhibits.",
                25.0,
                "Museum District",
                150,
            ),
            (
                "Cathedral or Temple Exploration",
                "Visit the iconic architectural landmark.",
                10.0,
                "Cultural Quarter",
                90,
            ),
            (
                "Local Traditional Craft Workshop",
                "Hands-on experience crafting authentic cultural items.",
                35.0,
                "Artisans Alley",
                90,
            ),
        ],
        "Food": [
            (
                "Famous Street Food Market Tour",
                "Sample local delicacies at bustling market stalls.",
                20.0,
                "Central Food Market",
                90,
            ),
            (
                "Traditional Local Lunch",
                "Authentic regional culinary experience.",
                30.0,
                "Historic Center",
                60,
            ),
            (
                "Fine Dining / Izakaya / Bistro Dinner",
                "Memorable evening dinner with signature specialties.",
                50.0,
                "Downtown Dining Quarter",
                120,
            ),
            (
                "Local Coffee & Pastry Tasting",
                "Morning coffee tasting at renowned local cafe.",
                10.0,
                "Riverside Promenade",
                45,
            ),
        ],
        "Adventure": [
            (
                "Scenic Mountain or Coastal Hike",
                "Breathtaking viewpoints and natural scenery.",
                0.0,
                "National Park Trailhead",
                180,
            ),
            (
                "Kayaking or Water Sports Excursion",
                "Explore waterways with a certified guide.",
                45.0,
                "Harbor Marina",
                120,
            ),
            (
                "Bicycle Tour Around Scenic Highlights",
                "Cycling through picturesque countryside and parks.",
                25.0,
                "City Bike Station",
                120,
            ),
            (
                "Zip-lining or Outdoor Canopy Adventure",
                "Thrilling adventure with panoramic views.",
                60.0,
                "Adventure Park",
                120,
            ),
        ],
        "Relaxation": [
            (
                "Botanical Gardens & Parkland Stroll",
                "Relaxing walk through tranquil landscaped gardens.",
                10.0,
                "Royal Botanic Gardens",
                90,
            ),
            (
                "Thermal Spa & Wellness Session",
                "Rest and rejuvenation with soothing treatments.",
                50.0,
                "Wellness Center",
                120,
            ),
            (
                "Sunset Beach or Scenic Viewpoint Relaxation",
                "Unwind with sunset views over the skyline.",
                0.0,
                "Scenic Overlook",
                60,
            ),
            (
                "Leisurely Afternoon Tea",
                "Relaxing tea and snacks in a garden setting.",
                20.0,
                "Grand Hotel Lounge",
                60,
            ),
        ],
        "Nightlife": [
            (
                "Craft Brewery or Wine Tasting Tour",
                "Taste local brews and regional wines.",
                35.0,
                "Entertainment District",
                90,
            ),
            (
                "Rooftop Lounge & Cocktails",
                "Stunning panoramic night views with drinks.",
                40.0,
                "Skyline Tower",
                120,
            ),
            (
                "Live Music & Cultural Performance",
                "Evening entertainment featuring local musicians.",
                30.0,
                "Music Hall",
                120,
            ),
        ],
        "Anime": [
            (
                "Akihabara Tech & Manga Exploration",
                "Browse rare collectibles and manga stores.",
                30.0,
                "Akihabara Main Street",
                120,
            ),
            (
                "Themed Cafe Experience",
                "Immersive anime-themed dining and merchandise.",
                25.0,
                "Themed District",
                75,
            ),
            (
                "Animation Museum & Exhibit",
                "Behind-the-scenes look at world-famous animation studios.",
                20.0,
                "Studio Gallery",
                90,
            ),
        ],
    }

    TIME_SLOTS = ["09:00 - 11:00", "12:00 - 13:30", "14:30 - 17:00", "19:00 - 21:00"]

    @classmethod
    def generate_plan(
        cls, destination: str, budget: float, duration_days: int, interests: List[str]
    ) -> List[Dict[str, Any]]:
        days_plan = []
        target_daily_budget = budget / max(1, duration_days)
        categories = interests if interests else ["Culture", "Food", "Relaxation"]

        for day_num in range(1, duration_days + 1):
            day_activities = []
            for slot_idx, time_slot in enumerate(cls.TIME_SLOTS):
                # Pick category
                if slot_idx == 1:
                    cat = "Food"
                elif slot_idx == 3:
                    cat = "Food" if "Food" in categories else random.choice(categories)
                else:
                    cat = categories[slot_idx % len(categories)]

                pool = cls.SAMPLE_ACTIVITIES.get(cat, cls.SAMPLE_ACTIVITIES["Culture"])
                act_choice = pool[(day_num + slot_idx) % len(pool)]

                title, desc, cost, loc, duration = act_choice
                # Scale cost proportionally to target daily budget if needed
                scaled_cost = min(cost, target_daily_budget * 0.4)
                scaled_cost = round(max(0.0, scaled_cost), 2)

                day_activities.append(
                    {
                        "time_slot": time_slot,
                        "title": f"{destination}: {title}",
                        "description": f"Day {day_num} in {destination}. {desc}",
                        "category": cat,
                        "estimated_cost": scaled_cost,
                        "location": f"{loc}, {destination}",
                        "duration_minutes": duration,
                        "sequence_order": slot_idx,
                    }
                )

            days_plan.append(
                {
                    "day_number": day_num,
                    "activities": day_activities,
                }
            )

        return days_plan
