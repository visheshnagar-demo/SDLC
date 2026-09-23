"""Unit tests for deduplication module."""
import pytest

pd = pytest.importorskip("pandas")
from pipeline.deduplicator import Deduplicator


def test_deduplicator_removes_duplicates():
    data = {
        "order_id": [1001, 1002, 1001, 1003],
        "customer_id": ["CUST-1", "CUST-2", "CUST-1", "CUST-3"],
        "customer_name": ["Alice", "Bob", "Alice Updated", "Carlos"],
        "created_at": [
            "2026-09-01T10:00:00Z",
            "2026-09-01T11:00:00Z",
            "2026-09-01T12:00:00Z",
            "2026-09-01T13:00:00Z",
        ],
    }
    df = pd.DataFrame(data)
    deduplicator = Deduplicator(key_columns=["order_id"])
    df_deduped, dropped_count = deduplicator.deduplicate(df)

    assert len(df_deduped) == 3
    assert dropped_count == 1
    # Check that latest record for order_id 1001 is preserved
    record_1001 = df_deduped[df_deduped["order_id"] == 1001].iloc[0]
    assert record_1001["customer_name"] == "Alice Updated"


def test_deduplicator_all_unique():
    data = {
        "order_id": [1001, 1002, 1003],
        "created_at": ["2026-09-01T10:00:00Z", "2026-09-01T11:00:00Z", "2026-09-01T12:00:00Z"],
    }
    df = pd.DataFrame(data)
    deduplicator = Deduplicator(key_columns=["order_id"])
    df_deduped, dropped_count = deduplicator.deduplicate(df)

    assert len(df_deduped) == 3
    assert dropped_count == 0
