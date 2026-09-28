from fastapi.testclient import TestClient


def test_list_bookmarks_empty_initially(
    client: TestClient, auth_headers: dict[str, str]
):
    response = client.get("/api/v1/bookmarks", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_add_and_remove_bookmark(client: TestClient, auth_headers: dict[str, str]):
    # Add bookmark
    add_res = client.post(
        "/api/v1/bookmarks/gradient-descent-tutorial", headers=auth_headers
    )
    assert add_res.status_code == 200
    add_data = add_res.json()
    assert add_data["bookmarked"] is True
    assert add_data["bookmark"]["tutorial"]["slug"] == "gradient-descent-tutorial"

    # List bookmarks
    list_res = client.get("/api/v1/bookmarks", headers=auth_headers)
    assert list_res.status_code == 200
    bms = list_res.json()
    assert len(bms) >= 1
    assert any(b["tutorial"]["slug"] == "gradient-descent-tutorial" for b in bms)

    # Delete bookmark
    del_res = client.delete(
        "/api/v1/bookmarks/gradient-descent-tutorial", headers=auth_headers
    )
    assert del_res.status_code == 200
    assert "Bookmark removed" in del_res.json()["detail"]

    # Verify deleted
    list_after = client.get("/api/v1/bookmarks", headers=auth_headers)
    assert not any(
        b["tutorial"]["slug"] == "gradient-descent-tutorial" for b in list_after.json()
    )


def test_remove_nonexistent_bookmark(client: TestClient, auth_headers: dict[str, str]):
    del_res = client.delete(
        "/api/v1/bookmarks/nonexistent-tutorial-xyz", headers=auth_headers
    )
    assert del_res.status_code == 404
