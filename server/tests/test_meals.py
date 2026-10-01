"""Tests for meal logging and nutrition intake calculations."""


def test_log_meal_breakfast(client):
    # Get Leo's profile
    profiles = client.get("/api/v1/profiles").json()
    leo = next(c for c in profiles if c["display_name"] == "Leo")
    leo_id = leo["id"]

    meal_payload = {
        "child_id": leo_id,
        "meal_type": "BREAKFAST",
        "items": [
            {
                "food_name": "Fresh Apple Slices",
                "food_category": "FRUITS",
                "servings": 1.0,
            },
            {
                "food_name": "Oatmeal with Honey",
                "food_category": "GRAINS",
                "servings": 1.5,
            },
        ],
        "water_glasses": 2,
    }

    response = client.post("/api/v1/meals", json=meal_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["meal"]["meal_type"] == "BREAKFAST"
    assert data["meal"]["water_glasses"] == 2
    assert len(data["meal"]["items"]) == 2
    assert data["points_awarded"] > 0
    assert data["daily_fruit_servings"] >= 1.0
    assert data["daily_grain_servings"] >= 1.5


def test_log_meal_and_get_meals_by_date(client):
    profiles = client.get("/api/v1/profiles").json()
    leo_id = profiles[0]["id"]

    meal_payload = {
        "child_id": leo_id,
        "meal_type": "LUNCH",
        "items": [
            {
                "food_name": "Grilled Chicken",
                "food_category": "PROTEINS",
                "servings": 1.0,
            },
            {
                "food_name": "Steamed Broccoli",
                "food_category": "VEGGIES",
                "servings": 1.0,
            },
        ],
        "water_glasses": 1,
    }

    log_resp = client.post("/api/v1/meals", json=meal_payload)
    assert log_resp.status_code == 201

    get_resp = client.get(f"/api/v1/meals?child_id={leo_id}")
    assert get_resp.status_code == 200
    meals = get_resp.json()
    assert len(meals) >= 1
