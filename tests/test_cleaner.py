"""Unit tests for DataCleaner and Deduplicator transformations."""
import datetime
from datetime import date, timezone
import pytest

pd = pytest.importorskip("pandas")

from src.transformation.cleaner import DataCleaner
from src.transformation.deduplicator import Deduplicator


def test_cleaner_timezone_naive_and_iso_utc():
    """Verifies that DataCleaner parses naive timestamp strings alongside ISO UTC strings and extracts correct order_date."""
    raw_data = {
        "order_id": ["101", "102", "103", "104"],
        "customer_id": ["CUST-1", "CUST-2", "CUST-3", "CUST-4"],
        "created_at": [
            "2026-04-20 08:00:00",       # Timezone naive
            "2026-09-01T10:14:22Z",      # ISO UTC
            "2026-11-15T18:30:00+00:00", # Explicit UTC offset
            None,                        # Missing
        ],
        "amount": ["150.50", "200.00", "50.25", "99.99"],
    }
    df = pd.DataFrame(raw_data)
    fixed_time = datetime.datetime(2026, 12, 1, 12, 0, 0, tzinfo=timezone.utc)

    cleaned = DataCleaner.clean(df, execution_time=fixed_time)

    assert len(cleaned) == 4
    # Check order_id types
    assert cleaned["order_id"].tolist() == [101, 102, 103, 104]

    # Check order_date extraction
    order_dates = cleaned["order_date"].tolist()
    assert order_dates[0] == date(2026, 4, 20)
    assert order_dates[1] == date(2026, 9, 1)
    assert order_dates[2] == date(2026, 11, 15)
    assert order_dates[3] == date(2026, 12, 1)  # Fallback to execution time

    # Check created_at timestamps
    assert cleaned["created_at"].iloc[0].year == 2026
    assert cleaned["created_at"].iloc[0].month == 4
    assert cleaned["created_at"].iloc[0].day == 20
    assert cleaned["created_at"].iloc[0].hour == 8
    assert cleaned["created_at"].iloc[0].tzinfo == timezone.utc


def test_cleaner_whitespace_and_null_sentinels():
    """Verifies whitespace stripping and null sentinel cleanup."""
    raw_data = {
        "order_id": ["201", "202", "203", None, "205"],
        "customer_name": ["  John Doe  ", "null", "N/A", "Jane", ""],
        "amount": [" 100.5 ", "none", "45.0", "12.0", "nan"],
        "created_at": ["2026-04-20 08:00:00", "2026-04-20 09:00:00", "2026-04-20 10:00:00", "2026-04-20", "2026-04-20"],
    }
    df = pd.DataFrame(raw_data)
    cleaned = DataCleaner.clean(df)

    assert len(cleaned) == 4  # Dropped None order_id
    assert cleaned["customer_name"].iloc[0] == "John Doe"
    assert cleaned["customer_name"].iloc[1] is None
    assert cleaned["customer_name"].iloc[2] is None
    assert cleaned["customer_name"].iloc[3] is None
    assert pd.isna(cleaned["amount"].iloc[1])


def test_cleaner_empty_dataframe():
    """Verifies ValueError when DataFrame is empty."""
    with pytest.raises(ValueError, match="empty"):
        DataCleaner.clean(pd.DataFrame())


def test_cleaner_missing_required_column():
    """Verifies ValueError when order_id is missing."""
    with pytest.raises(ValueError, match="Missing required column"):
        DataCleaner.clean(pd.DataFrame({"customer_id": ["C1"]}))


def test_deduplicator_keeps_latest():
    """Verifies that Deduplicator keeps the latest record for a duplicate key."""
    raw_data = {
        "order_id": [101, 101, 102],
        "customer_id": ["C1_old", "C1_new", "C2"],
        "created_at": [
            pd.Timestamp("2026-04-20 08:00:00", tz=timezone.utc),
            pd.Timestamp("2026-04-20 09:00:00", tz=timezone.utc),
            pd.Timestamp("2026-04-20 08:30:00", tz=timezone.utc),
        ],
        "order_date": [date(2026, 4, 20), date(2026, 4, 20), date(2026, 4, 20)],
    }
    df = pd.DataFrame(raw_data)
    deduped = Deduplicator.deduplicate(df, key_column="order_id")

    assert len(deduped) == 2
    assert deduped.loc[deduped["order_id"] == 101, "customer_id"].values[0] == "C1_new"
