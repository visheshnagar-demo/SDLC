"""Unit tests for DataCleanerTransformer."""
import pytest

pd = pytest.importorskip("pandas")
pydantic = pytest.importorskip("pydantic")

from server.config import ETLConfig
from server.pipeline.transformer import DataCleanerTransformer
from server.utils.exceptions import TransformationError


@pytest.fixture
def sample_config():
    return ETLConfig()


@pytest.fixture
def transformer(sample_config):
    return DataCleanerTransformer(config=sample_config)


def test_strip_whitespace(transformer):
    data = {
        "id": [" 101 ", "102\t", "\n103\n"],
        "raw_text": ["  hello world  ", " foo bar ", "   test   "],
    }
    df = pd.DataFrame(data)
    result = transformer.strip_whitespace_and_sanitize_nulls(df)

    assert result["id"].tolist() == ["101", "102", "103"]
    assert result["raw_text"].tolist() == ["hello world", "foo bar", "test"]


def test_sanitize_nulls(transformer):
    data = {
        "id": ["1", "2", "3", "4", "5", "6"],
        "raw_text": ["null", "None", "", "NULL", "NaN", "valid text"],
    }
    df = pd.DataFrame(data)
    result = transformer.strip_whitespace_and_sanitize_nulls(df)

    assert result["raw_text"].iloc[0] is None
    assert result["raw_text"].iloc[1] is None
    assert result["raw_text"].iloc[2] is None
    assert result["raw_text"].iloc[3] is None
    assert result["raw_text"].iloc[4] is None
    assert result["raw_text"].iloc[5] == "valid text"


def test_coerce_types(transformer):
    data = {
        "id": [1, 2, 3],
        "raw_text": ["a", "b", "c"],
        "numeric_val": ["12.5", "100", "invalid_num"],
        "is_active": ["true", "0", "YES"],
        "created_at": ["2026-05-18T12:00:00Z", "2026-05-19 14:30:00", "invalid_date"],
    }
    df = pd.DataFrame(data)
    result = transformer.coerce_types(df)

    assert result["id"].tolist() == ["1", "2", "3"]
    assert result["numeric_val"].iloc[0] == 12.5
    assert result["numeric_val"].iloc[1] == 100.0
    assert pd.isna(result["numeric_val"].iloc[2])

    assert result["is_active"].iloc[0] is True
    assert result["is_active"].iloc[1] is False
    assert result["is_active"].iloc[2] is True

    assert type(result["is_active"].iloc[0]) is bool
    assert type(result["is_active"].iloc[1]) is bool
    assert type(result["is_active"].iloc[2]) is bool

    assert not pd.isna(result["created_at"].iloc[0])
    assert not pd.isna(result["created_at"].iloc[1])
    assert pd.isna(result["created_at"].iloc[2])


def test_full_transform_success(transformer):
    data = {
        "id": ["  101  ", "102"],
        "raw_text": ["  clean me  ", "another row"],
        "numeric_val": ["42.5", "99.0"],
        "is_active": ["true", "false"],
        "created_at": ["2026-05-18 10:00:00", "2026-05-18 11:00:00"],
    }
    df = pd.DataFrame(data)
    result = transformer.transform(df)

    assert len(result) == 2
    assert result["id"].tolist() == ["101", "102"]
    assert result["raw_text"].tolist() == ["clean me", "another row"]
    assert result["numeric_val"].tolist() == [42.5, 99.0]
    assert result["is_active"].tolist() == [True, False]
    assert result["is_active"].iloc[0] is True
    assert result["is_active"].iloc[1] is False


def test_transform_empty_dataframe(transformer):
    df = pd.DataFrame()
    result = transformer.transform(df)
    assert len(result) == 0


def test_transform_circuit_breaker(transformer):
    data = {
        "id": [None, None],
        "raw_text": ["", "   "],
        "numeric_val": [None, None],
    }
    df = pd.DataFrame(data)
    with pytest.raises(TransformationError):
        transformer.transform(df)
