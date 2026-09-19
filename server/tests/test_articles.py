def test_create_and_list_articles(client, journalist_headers):
    payload = {
        "headline": "New Renewable Energy Policy Unveiled",
        "body": "Government officials announced a comprehensive plan to transition to 100% renewable power.",
        "summary": "Renewable energy policy shift announced.",
        "is_ticker_item": False,
        "priority": "HIGH",
        "status": "DRAFT",
    }
    response = client.post("/api/v1/articles", json=payload, headers=journalist_headers)
    assert response.status_code == 201
    article = response.json()
    assert article["headline"] == "New Renewable Energy Policy Unveiled"
    assert article["version"] == 1

    list_resp = client.get("/api/v1/articles", headers=journalist_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1


def test_article_optimistic_locking(client, journalist_headers):
    # Draft article
    payload = {
        "headline": "Locking Test Article",
        "body": "Testing optimistic concurrency control.",
        "status": "DRAFT",
    }
    created = client.post(
        "/api/v1/articles", json=payload, headers=journalist_headers
    ).json()
    article_id = created["id"]

    # First update with correct version (1)
    update_1 = client.put(
        f"/api/v1/articles/{article_id}",
        json={"headline": "Locking Test Article V2", "version": 1},
        headers=journalist_headers,
    )
    assert update_1.status_code == 200
    assert update_1.json()["version"] == 2

    # Second update with stale version (1) -> Conflict!
    update_stale = client.put(
        f"/api/v1/articles/{article_id}",
        json={"headline": "Locking Test Article Stale", "version": 1},
        headers=journalist_headers,
    )
    assert update_stale.status_code == 409
    assert "Conflict" in update_stale.json()["detail"]


def test_update_article_status(client, manager_headers, journalist_headers):
    # Journalist drafts
    payload = {
        "headline": "Article for Review",
        "body": "Review body text.",
        "status": "DRAFT",
    }
    created = client.post(
        "/api/v1/articles", json=payload, headers=journalist_headers
    ).json()
    article_id = created["id"]

    # Editor/Manager approves
    status_resp = client.patch(
        f"/api/v1/articles/{article_id}/status",
        json={"status": "APPROVED"},
        headers=manager_headers,
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "APPROVED"
