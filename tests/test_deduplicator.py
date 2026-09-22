"""Unit tests for the Deduplicator module."""
from datetime import date, timezone
import pytest

pd = pytest.importorskip("pandas")

from src.transformation.deduplicator import Deduplicator


def test_deduplicate_empty_dataframe():
    """Verifies that deduplicating an empty dataframe returns an empty dataframe."""
    df = pd.DataFrame()
    result = Deduplicator.deduplicate(df)
    assert result.empty


def test_deduplicate_missing_key_column():
    """Verifies that ValueError is raised if the key column is not present."""
    df = pd.DataFrame({"some_col": [1, 2, 3]})
    with pytest.raises(ValueError, match="Key column 'order_id' not found"):
        Deduplicator.deduplicate(df, key_column="order_id")


def test_deduplicate_no_duplicates():
    """Verifies that deduplication preserves all rows when all keys are unique."""
    df = pd.DataFrame({
        "order_id": [1, 2, 3],
        "customer_id": ["C1", "C2", "C3"],
        "created_at": [
            pd.Timestamp("2026-04-20 08:00:00", tz=timezone.utc),
            pd.Timestamp("2026-04-20 09:00:00", tz=timezone.utc),
            pd.Timestamp("2026-04-20 10:00:00", tz=timezone.utc),
        ],
    })
    result = Deduplicator.deduplicate(df)
    assert len(result) == 3
    assert result["order_id"].tolist() == [1, 2, 3]


def test_deduplicate_keeps_latest_created_at():
    """Verifies that Deduplicator keeps the row with the latest created_at."""
    df = pd.DataFrame({
        "order_id": [101, 101, 102],
        "customer_id": ["C1_old", "C1_new", "C2"],
        "created_at": [
            pd.Timestamp("2026-04-20 08:00:00", tz=timezone.utc),
            pd.Timestamp("2026-04-20 09:30:00", tz=timezone.utc),
            pd.Timestamp("2026-04-20 08:30:00", tz=timezone.utc),
        ],
        "order_date": [date(2026, 4, 20), date(2026, 4, 20), date(2026, 4, 20)],
    })
    result = Deduplicator.deduplicate(df, key_column="order_id")
    assert len(result) == 2
    match_row = result[result["order_id"] == 101].iloc[0]
    assert match_row["customer_id"] == "C1_new"


def test_deduplicate_tie_breaker_fewest_nulls():
    """Verifies that when created_at is identical, the row with fewer nulls is chosen."""
    ts = pd.Timestamp("2026-04-20 08:00:00", tz=timezone.utc)
    df = pd.DataFrame({
        "order_id": [101, 101],
        "customer_id": ["C1", None],
        "customer_name": [None, "Jane Doe"],
        "product_category": ["Electronics", "Electronics"],
        "amount": [150.0, 150.0],
        "currency": ["USD", None],  # row 0 has 1 null, row 1 has 2 nulls
        "created_at": [ts, ts],
    })
    result = Deduplicator.deduplicate(df, key_column="order_id")
    assert len(result) == 1
    assert result.iloc[0]["customer_id"] == "C1"


def test_deduplicate_custom_key_column():
    """Verifies deduplication on a custom key column."""
    df = pd.DataFrame({
        "custom_key": ["K1", "K1", "K2"],
        "value": [10, 20, 30],
        "created_at": [
            pd.Timestamp("2026-01-01 00:00:00", tz=timezone.utc),
            pd.Timestamp("2026-01-02 00:00:00", tz=timezone.utc),
            pd.Timestamp("2026-01-01 00:00:00", tz=timezone.utc),
        ],
    })
    result = Deduplicator.deduplicate(df, key_column="custom_key")
    assert len(result) == 2
    k1_val = result[result["custom_key"] == "K1"]["value"].iloc[0]
    assert k1_val == 20
