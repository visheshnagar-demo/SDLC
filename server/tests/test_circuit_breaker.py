"""Unit tests for CircuitBreaker."""
import pytest

pd = pytest.importorskip("pandas")
from server.pipeline.circuit_breaker import CircuitBreaker, CircuitBreakerError
from server.pipeline.config import PipelineConfig


@pytest.fixture
def test_config():
    return PipelineConfig(
        gcp_project_id="upbeat-repeater-477110-q6",
        bq_dataset="analytics",
        bq_table="test2",
        gcs_source_bucket="sdlc-workspec-store",
        max_error_threshold_pct=0.05,
    )


def test_circuit_breaker_pass(test_config):
    cb = CircuitBreaker(test_config)
    df = pd.DataFrame({"rank": [1, 2, 3], "artist": ["A", "B", "C"]})
    result = cb.validate(raw_count=3, df_transformed=df)
    assert len(result) == 3


def test_circuit_breaker_trip(test_config):
    cb = CircuitBreaker(test_config)
    # 2 out of 4 rows are null (50% corruption > 5% allowed)
    df = pd.DataFrame(
        {
            "rank": [1, 2, None, None],
            "artist": ["A", "B", None, None],
            "_source_file": ["s", "s", "s", "s"],
        }
    )
    with pytest.raises(CircuitBreakerError) as exc_info:
        cb.validate(raw_count=4, df_transformed=df)

    assert "exceeded max allowed threshold" in str(exc_info.value)
