"""Tests for avatar customization catalog, unlocking, and equipping."""


def test_avatar_catalog_and_unlock(client):
    profiles = client.get("/api/v1/profiles").json()
    leo_id = profiles[0]["id"]

    # 1. Fetch catalog
    catalog_resp = client.get(f"/api/v1/avatars/catalog?child_id={leo_id}")
    assert catalog_resp.status_code == 200
    catalog = catalog_resp.json()
    assert len(catalog) >= 3

    # Find an item that costs <= 100 points
    target_item = next(it for it in catalog if it["item_name"] == "Star Glasses")
    item_id = target_item["id"]

    # 2. Unlock item
    unlock_resp = client.post(
        "/api/v1/avatars/unlock",
        json={"child_id": leo_id, "item_id": item_id},
    )
    assert unlock_resp.status_code == 200
    unlocked_item = unlock_resp.json()
    assert unlocked_item["is_unlocked"] is True

    # 3. Equip item
    equip_resp = client.put(
        "/api/v1/avatars/equip",
        json={"child_id": leo_id, "item_id": item_id, "is_equipped": True},
    )
    assert equip_resp.status_code == 200
    equip_data = equip_resp.json()
    assert any(eq["id"] == item_id for eq in equip_data["equipped_items"])
