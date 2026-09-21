"""Unit and transformation test suite for SCRUM-333 ETL pipeline."""
import ast
import json
import os
import re
from datetime import datetime, timezone, timedelta
import pytest

try:
    import pandas as pd
except ImportError:
    pd = None


def test_transformer_ast():
    """Verify transformer module syntax."""
    path = os.path.join("pipeline", "transformer.py")
    assert os.path.isfile(path)
    with open(path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_extractor_ast():
    """Verify extractor module syntax."""
    path = os.path.join("pipeline", "extractor.py")
    assert os.path.isfile(path)
    with open(path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_loader_ast():
    """Verify loader module syntax."""
    path = os.path.join("pipeline", "loader.py")
    assert os.path.isfile(path)
    with open(path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
    assert tree is not None


def test_transformation_spec_validity():
    """Verify transformation_spec.json structure and coverage."""
    spec_path = "transformation_spec.json"
    assert os.path.isfile(spec_path)
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert "columns" in spec
    column_targets = [c["target_name"] for c in spec["columns"]]
    assert "rank" in column_targets
    assert "amount" in column_targets
    assert "us_time" in column_targets
    assert "name" in column_targets
    assert "quantity" in column_targets


def test_openapi_spec_validity():
    """Verify openapi.json structure and schema definitions."""
    openapi_path = "openapi.json"
    assert os.path.isfile(openapi_path)
    with open(openapi_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    assert spec.get("openapi") == "3.0.3"
    assert "paths" in spec
    assert "components" in spec
    assert "schemas" in spec["components"]
    assert "EtlRecord" in spec["components"]["schemas"]
    assert "EtlConfig" in spec["components"]["schemas"]
    assert "EtlRunSummary" in spec["components"]["schemas"]


def test_rank_sorting_logic_pure():
    """Pure logic test: Verify rank ordering with nulls last."""
    raw_ranks = ["3", "1", "a", "5", None, "2"]
    def parse_rank(val):
        try:
            return (0, int(val))
        except (ValueError, TypeError):
            return (1, 0)
    
    sorted_ranks = sorted(raw_ranks, key=parse_rank)
    assert sorted_ranks[:4] == ["1", "2", "3", "5"]
    assert sorted_ranks[4:] == ["a", None]


def test_usd_to_inr_pure_logic():
    """Pure logic test: Verify currency conversion calculation."""
    def convert_usd_to_inr(raw_amount_str, rate=83.5):
        clean_str = re.sub(r"[\$,\s]", "", str(raw_amount_str))
        amt = float(clean_str)
        return round(amt * rate, 2)

    assert convert_usd_to_inr("$1,250.50", 83.5) == 104416.75
    assert convert_usd_to_inr("$2,450.00", 84.0) == 205800.00


def test_gmt_to_ist_timezone_pure_logic():
    """Pure logic test: Verify GMT to IST (+5:30) conversion."""
    gmt_str = "09/21/2026 08:30:00 AM GMT"
    clean_gmt = gmt_str.replace(" GMT", "")
    dt_utc = datetime.strptime(clean_gmt, "%m/%d/%Y %I:%M:%S %p").replace(tzinfo=timezone.utc)
    ist_offset = timezone(timedelta(hours=5, minutes=30))
    dt_ist = dt_utc.astimezone(ist_offset)

    assert dt_ist.strftime("%Y-%m-%d") == "2026-09-21"
    assert dt_ist.strftime("%H:%M:%S") == "14:00:00"


@pytest.mark.skipif(pd is None, reason="pandas is not installed in current test runner")
def test_rank_sorting_nulls_last_pandas():
    """Verify that rank is sorted in ascending order and invalid/null values are at the end."""
    from pipeline.transformer import DataTransformer

    data = {
        "rank": ["3", "1", "a", "5", None, "2"],
        "amount": ["$100", "$200", "$300", "$400", "$500", "$600"],
        "us_time": ["09/21/2026 08:30:00 AM GMT"] * 6,
        "name": ["A", "B", "C", "D", "E", "F"],
        "quantity": [1, 2, 3, 4, 5, 6],
    }
    df_raw = pd.DataFrame(data)
    transformer = DataTransformer(exchange_rate=83.5)
    df_transformed = transformer.transform(df_raw)

    ranks = df_transformed["rank"].tolist()
    assert ranks[0] == 1
    assert ranks[1] == 2
    assert ranks[2] == 3
    assert ranks[3] == 5
    assert pd.isna(ranks[4])
    assert pd.isna(ranks[5])


@pytest.mark.skipif(pd is None, reason="pandas is not installed in current test runner")
def test_usd_to_inr_conversion_pandas():
    """Verify that amount in USD is converted accurately to INR using runtime exchange rate."""
    from pipeline.transformer import DataTransformer

    data = {
        "rank": [1, 2],
        "amount": ["$1,250.50", "$2,450.00"],
        "us_time": ["09/21/2026 08:30:00 AM GMT", "09/21/2026 09:15:00 AM GMT"],
    }
    df_raw = pd.DataFrame(data)
    custom_rate = 84.0
    transformer = DataTransformer(exchange_rate=custom_rate)
    df_transformed = transformer.transform(df_raw)

    assert df_transformed.loc[0, "amount"] == 1250.50
    assert df_transformed.loc[0, "exchange_rate"] == 84.0
    assert df_transformed.loc[0, "amount_inr"] == round(1250.50 * 84.0, 2)


@pytest.mark.skipif(pd is None, reason="pandas is not installed in current test runner")
def test_gmt_to_ist_timezone_conversion_pandas():
    """Verify that GMT us_time is converted to IST (+5:30) and split into indian_date and indian_time."""
    from pipeline.transformer import DataTransformer

    data = {
        "rank": [1, 2],
        "amount": ["100", "200"],
        "us_time": ["09/21/2026 08:30:00 AM GMT", "09/21/2026 11:45:00 PM GMT"],
    }
    df_raw = pd.DataFrame(data)
    transformer = DataTransformer(exchange_rate=83.5)
    df_transformed = transformer.transform(df_raw)

    row0 = df_transformed.iloc[0]
    assert row0["indian_date"] == "2026-09-21"
    assert row0["indian_time"] == "14:00:00"

    row1 = df_transformed.iloc[1]
    assert row1["indian_date"] == "2026-09-22"
    assert row1["indian_time"] == "05:15:00"
