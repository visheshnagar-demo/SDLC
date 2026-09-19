def test_list_channels(client, journalist_headers):
    response = client.get("/api/v1/channels", headers=journalist_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_channel(client, manager_headers):
    payload = {
        "name": "Sports News 24",
        "code": "SPORTS-24",
        "stream_url": "https://stream.sports.example.com/live.m3u8",
        "resolution": "1080p",
        "language": "English",
        "status": "ACTIVE",
        "is_live": False,
    }
    response = client.post("/api/v1/channels", json=payload, headers=manager_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sports News 24"
    assert data["code"] == "SPORTS-24"


def test_update_channel(client, manager_headers):
    # First list to get a channel id
    channels = client.get("/api/v1/channels", headers=manager_headers).json()
    channel_id = channels[0]["id"]

    response = client.put(
        f"/api/v1/channels/{channel_id}",
        json={"resolution": "4K", "language": "Spanish"},
        headers=manager_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["resolution"] == "4K"
    assert data["language"] == "Spanish"


def test_delete_active_channel_restricted(client, manager_headers):
    # Try deleting an active channel without force
    channels = client.get("/api/v1/channels", headers=manager_headers).json()
    active_channel = next((c for c in channels if c["status"] == "ACTIVE"), None)
    if active_channel:
        response = client.delete(
            f"/api/v1/channels/{active_channel['id']}", headers=manager_headers
        )
        assert response.status_code == 400
        assert (
            "Cannot delete an active live-broadcasting channel"
            in response.json()["detail"]
        )


def test_delete_channel_with_force(client, manager_headers):
    channels = client.get("/api/v1/channels", headers=manager_headers).json()
    channel_id = channels[0]["id"]
    response = client.delete(
        f"/api/v1/channels/{channel_id}?force=true", headers=manager_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "OFF_AIR"
