import datetime
from server.pipeline.transformer import transform_record, transform_sales_records


def test_transform_record():
    raw_record = {
        "order_id": " ord-123 ",
        "customer_id": " cust-456 ",
        "customer_email": " user@example.com ",
        "order_date": datetime.date(2026, 5, 18),
        "amount": 199.999,
        "currency": "usd",
        "status": "COMPLETED",
        "created_at": datetime.datetime(2026, 5, 18, 12, 0, 0),
    }

    transformed = transform_record(raw_record)

    assert transformed["order_id"] == "ord-123"
    assert transformed["customer_id"] == "cust-456"
    assert transformed["customer_email"] == "user@example.com"
    assert transformed["order_date"] == "2026-05-18"
    assert transformed["amount"] == 200.00
    assert transformed["currency"] == "USD"
    assert transformed["status"] == "completed"
    assert "ingested_at" in transformed
    assert transformed["source_created_at"] == "2026-05-18T12:00:00"


def test_transform_sales_records():
    records = [
        {
            "order_id": "1",
            "customer_email": "a@b.com",
            "order_date": "2026-05-18",
            "amount": 10.0,
        },
        {
            "order_id": "2",
            "customer_email": "c@d.com",
            "order_date": "2026-05-18",
            "amount": 20.0,
        },
    ]
    results = transform_sales_records(records)
    assert len(results) == 2
    assert results[0]["currency"] == "USD"
    assert results[1]["status"] == "completed"
