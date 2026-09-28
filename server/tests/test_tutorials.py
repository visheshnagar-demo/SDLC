from fastapi.testclient import TestClient


def test_get_tutorial_by_slug(client: TestClient):
    response = client.get("/api/v1/tutorials/gradient-descent-tutorial")
    assert response.status_code == 200
    tut = response.json()
    assert tut["slug"] == "gradient-descent-tutorial"
    assert tut["title"] == "Gradient Descent Optimization"
    assert "Gradient descent is a first-order" in tut["content_markdown"]
    assert tut["math_formulas"] is not None
    assert isinstance(tut["code_snippets"], list)
    assert len(tut["code_snippets"]) >= 1
    assert "numpy" in tut["code_snippets"][0]["code"].lower()
    assert tut["quiz_id"] is not None


def test_get_tutorial_not_found(client: TestClient):
    response = client.get("/api/v1/tutorials/non-existent-tutorial-slug")
    assert response.status_code == 404


def test_search_tutorials_by_keyword(client: TestClient):
    response = client.get("/api/v1/tutorials/search?q=gradient")
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert any(r["slug"] == "gradient-descent-tutorial" for r in results)
    first = results[0]
    assert "snippet" in first
    assert "track_title" in first
    assert "module_title" in first


def test_search_tutorials_by_framework(client: TestClient):
    response = client.get("/api/v1/tutorials/search?framework=pytorch")
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert any(r["slug"] == "self-attention-mechanism" for r in results)


def test_search_tutorials_no_results(client: TestClient):
    response = client.get("/api/v1/tutorials/search?q=xyznonexistentterm123")
    assert response.status_code == 200
    assert response.json() == []
