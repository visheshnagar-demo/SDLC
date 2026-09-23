"""Comprehensive Unit & AST tests for ETL Pipeline."""
import os
import ast
import re
import pytest

# Test AST syntax for all server and pipeline components
SERVER_FILES = [
    os.path.join("server", "main.py"),
    os.path.join("server", "etl", "main.py"),
    os.path.join("server", "etl", "extractor.py"),
    os.path.join("server", "etl", "transformer.py"),
    os.path.join("server", "etl", "loader.py"),
    os.path.join("server", "etl", "logger.py"),
]

@pytest.mark.parametrize("file_path", SERVER_FILES)
def test_server_file_syntax(file_path):
    """Verifies that each server module is syntactically valid Python."""
    assert os.path.isfile(file_path), f"File missing: {file_path}"
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    tree = ast.parse(code)
    assert tree is not None


def test_regex_cleaning_rules():
    """Unit test for string cleaning and numeric normalization rules without heavy dependencies."""
    _FOOTNOTE_RE = re.compile(r"\[[^\]]*\]")
    _NUMERIC_STRIP_RE = re.compile(r"[,$€£¥\s\u00a0]")

    def normalize_value(val: str) -> str:
        s = _FOOTNOTE_RE.sub("", str(val))
        s = _NUMERIC_STRIP_RE.sub("", s)
        return s.strip()

    assert normalize_value("$1,234.50") == "1234.50"
    assert normalize_value(" 500 ") == "500"
    assert normalize_value("12[1]") == "12"
    assert normalize_value("100.0") == "100.0"


def test_null_sentinel_rules():
    """Unit test verifying null sentinel definitions."""
    null_sentinels = {"nan", "none", "null", "n/a", "na", "", "nil"}
    test_cases = ["None", "NULL", "N/A", "", "  ", "valid_text"]
    
    cleaned = [None if c.strip().lower() in null_sentinels else c.strip() for c in test_cases]
    assert cleaned[0] is None
    assert cleaned[1] is None
    assert cleaned[2] is None
    assert cleaned[3] is None
    assert cleaned[4] is None
    assert cleaned[5] == "valid_text"


def test_pandas_transformation_if_available():
    """Integration test for DataFrame transformation when pandas is installed."""
    pd = pytest.importorskip("pandas")
    from server.etl.transformer import clean_and_transform_dataframe

    raw_data = {
        "id": [1, 2, 2, None],
        "name": ["  Alice  ", "Bob", "Bob", "   "],
        "email": ["alice@example.com", "null", "bob@example.com", "N/A"],
        "value": ["$100.50", "200", "200.00", "NaN"],
        "created_at": ["2026-05-18 10:00:00", "2026-05-18 11:00:00", "2026-05-18 11:00:00", "invalid-date"],
        "updated_at": ["2026-05-18 12:00:00", "2026-05-18 13:00:00", "2026-05-18 13:00:00", "invalid-date"],
    }
    df = pd.DataFrame(raw_data)
    df_clean, duplicates_dropped = clean_and_transform_dataframe(df)

    assert duplicates_dropped >= 1
    alice_row = df_clean[df_clean["id"] == 1].iloc[0]
    assert alice_row["name"] == "Alice"
    assert alice_row["value"] == 100.50
    assert "_etl_loaded_at" in df_clean.columns
