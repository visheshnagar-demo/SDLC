import json, os

def test_schema_valid():
    p = os.path.join("schemas", "sales_order_schema.json")
    assert os.path.exists(p)
    with open(p) as f:
        s = json.load(f)
    assert any(x["name"] == "order_id" for x in s)
