"""Unit tests for DataValidator module."""
import pytest
pd = pytest.importorskip("pandas")
from pipeline.validator import DataValidator


def test_validator_passes_valid_data():
    df = pd.DataFrame({
        "rank": [1, 2],
        "artist": ["Taylor Swift", "Beyoncé"],
        "tour_title": ["The Eras Tour", "Renaissance World Tour"]
    })
    validator = DataValidator(max_error_threshold=0.05)
    valid_df = validator.validate(df)
    assert len(valid_df) == 2


def test_validator_circuit_breaker_on_all_null():
    df = pd.DataFrame({
        "rank": [None, None],
        "artist": [None, None],
        "tour_title": [None, None]
    })
    validator = DataValidator()
    with pytest.raises(RuntimeError, match="FATAL: Circuit breaker triggered"):
        validator.validate(df)


def test_validator_threshold_exceeded():
    df = pd.DataFrame({
        "rank": [1, None, None],
        "artist": ["Artist A", None, None],
        "tour_title": ["Tour A", None, None]
    })
    validator = DataValidator(max_error_threshold=0.10)
    with pytest.raises(RuntimeError, match="FATAL: Error threshold exceeded"):
        validator.validate(df)
