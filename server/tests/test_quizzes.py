"""Tests for educational food trivia and quizzes."""


def test_get_daily_quizzes(client):
    response = client.get("/api/v1/quizzes/daily")
    assert response.status_code == 200
    quizzes = response.json()
    assert isinstance(quizzes, list)
    assert len(quizzes) >= 1
    assert "question_text" in quizzes[0]
    assert isinstance(quizzes[0]["options"], list)


def test_submit_quiz_answers(client):
    profiles = client.get("/api/v1/profiles").json()
    leo_id = profiles[0]["id"]
    initial_points = profiles[0]["total_points"]

    quizzes = client.get("/api/v1/quizzes/daily").json()
    assert len(quizzes) > 0
    q = quizzes[0]

    submit_payload = {
        "child_id": leo_id,
        "answers": {
            q["id"]: q["options"][0],  # Crunchy Carrots or first option
        },
    }

    response = client.post("/api/v1/quizzes/submit", json=submit_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["child_id"] == leo_id
    assert "total_earned_points" in data
    assert "results" in data
    assert len(data["results"]) == 1
    assert data["updated_total_points"] >= initial_points
