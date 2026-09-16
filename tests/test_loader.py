import os
from server.pipeline.loader import (
    load_to_bigquery,
    get_mock_loaded_records,
    clear_mock_loaded_records,
    check_bigquery_connection,
)


def test_bigquery_connection_check():
    os.environ["TESTING"] = "true"
    assert check_bigquery_connection() is True


def test_load_to_bigquery():
    clear_mock_loaded_records()
    sample_records = [
        {
            "order_id": "ord-001",
            "customer_id": "cust-001",
            "customer_email": "user@example.com",
            "order_date": "2026-05-18",
            "amount": 100.0,
            "currency": "USD",
            "status": "completed",
            "source_created_at": "2026-05-18T10:00:00",
            "ingested_at": "2026-05-18T10:05:00",
        }
    ]

    loaded_count = load_to_bigquery(sample_records)
    assert loaded_count == 1
    mock_records = get_mock_loaded_records()
    assert len(mock_records) == 1
    assert mock_records[0]["order_id"] == "ord-001"


def test_load_to_bigquery_empty():
    clear_mock_loaded_records()
    assert load_to_bigquery([]) == 0
