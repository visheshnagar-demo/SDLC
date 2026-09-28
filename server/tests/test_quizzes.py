from fastapi.testclient import TestClient


def test_get_quiz_unauthorized(client: TestClient):
    response = client.get("/api/v1/quizzes/gradient-descent-optimization")
    assert response.status_code == 401


def test_get_quiz_authenticated(client: TestClient, auth_headers: dict[str, str]):
    response = client.get(
        "/api/v1/quizzes/gradient-descent-optimization", headers=auth_headers
    )
    assert response.status_code == 200
    quiz = response.json()
    assert quiz["title"] == "Quiz: Gradient Descent & Optimization"
    assert quiz["passing_score"] == 70
    assert len(quiz["questions"]) >= 2
    # Ensure answers and explanations are NOT leaked in questions
    for q in quiz["questions"]:
        assert "question_text" in q
        assert "options" in q
        assert "correct_answer" not in q
        assert "explanation" not in q


def test_submit_quiz_pass(client: TestClient, auth_headers: dict[str, str]):
    # First get the quiz
    quiz_res = client.get(
        "/api/v1/quizzes/gradient-descent-optimization", headers=auth_headers
    )
    assert quiz_res.status_code == 200
    quiz = quiz_res.json()
    quiz_id = quiz["id"]
    q1_id = quiz["questions"][0]["id"]
    q2_id = quiz["questions"][1]["id"]

    # Submit correct answers: q1 -> 'b', q2 -> 'a'
    submission_payload = {
        "answers": [
            {"question_id": q1_id, "selected_option": "b"},
            {"question_id": q2_id, "selected_option": "a"},
        ]
    }
    sub_res = client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json=submission_payload,
        headers=auth_headers,
    )
    assert sub_res.status_code == 200
    data = sub_res.json()
    assert data["quiz_id"] == quiz_id
    assert data["passed"] is True
    assert data["score_percentage"] == 100.0
    assert data["correct_count"] == 2
    assert data["is_completed"] is True
    assert len(data["feedback"]) == 2
    for fb in data["feedback"]:
        assert fb["is_correct"] is True
        assert fb["explanation"] != ""


def test_submit_quiz_fail(client: TestClient, auth_headers: dict[str, str]):
    quiz_res = client.get(
        "/api/v1/quizzes/gradient-descent-optimization", headers=auth_headers
    )
    quiz = quiz_res.json()
    quiz_id = quiz["id"]
    q1_id = quiz["questions"][0]["id"]
    q2_id = quiz["questions"][1]["id"]

    # Submit wrong answers
    submission_payload = {
        "answers": [
            {"question_id": q1_id, "selected_option": "c"},
            {"question_id": q2_id, "selected_option": "d"},
        ]
    }
    sub_res = client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json=submission_payload,
        headers=auth_headers,
    )
    assert sub_res.status_code == 200
    data = sub_res.json()
    assert data["passed"] is False
    assert data["score_percentage"] == 0.0
    assert data["correct_count"] == 0
    assert len(data["feedback"]) == 2
    for fb in data["feedback"]:
        assert fb["is_correct"] is False
