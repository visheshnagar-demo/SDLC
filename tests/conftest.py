"""Pytest configuration and lightweight fallback engine for test execution without pandas."""
import csv
import io
import sys
import types
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from unittest.mock import MagicMock

# 1. Mock 'google.cloud' hierarchy if missing
if "google.cloud.exceptions" not in sys.modules:
    try:
        import google.cloud.exceptions
    except ImportError:
        class NotFound(Exception):
            pass
        
        g_mod = types.ModuleType("google")
        gc_mod = types.ModuleType("google.cloud")
        gce_mod = types.ModuleType("google.cloud.exceptions")
        gce_mod.NotFound = NotFound
        gc_mod.exceptions = gce_mod
        g_mod.cloud = gc_mod
        sys.modules["google"] = g_mod
        sys.modules["google.cloud"] = gc_mod
        sys.modules["google.cloud.exceptions"] = gce_mod

if "google.cloud.storage" not in sys.modules:
    try:
        import google.cloud.storage
    except ImportError:
        gcs_mod = types.ModuleType("google.cloud.storage")
        gcs_mod.Client = MagicMock
        sys.modules["google.cloud.storage"] = gcs_mod
        if "google.cloud" in sys.modules:
            sys.modules["google.cloud"].storage = gcs_mod

if "google.cloud.bigquery" not in sys.modules:
    try:
        import google.cloud.bigquery
    except ImportError:
        bq_mod = types.ModuleType("google.cloud.bigquery")
        bq_mod.Client = MagicMock
        bq_mod.DatasetReference = MagicMock
        bq_mod.Dataset = MagicMock
        bq_mod.TableReference = MagicMock
        bq_mod.Table = MagicMock
        bq_mod.SchemaField = MagicMock
        bq_mod.TimePartitioning = MagicMock
        bq_mod.TimePartitioningType = MagicMock
        bq_mod.LoadJobConfig = MagicMock
        sys.modules["google.cloud.bigquery"] = bq_mod
        if "google.cloud" in sys.modules:
            sys.modules["google.cloud"].bigquery = bq_mod

# 2. Mock 'airflow' if missing
if "airflow" not in sys.modules:
    try:
        import airflow
    except ImportError:
        af_mod = types.ModuleType("airflow")
        af_mod.DAG = MagicMock
        af_op_mod = types.ModuleType("airflow.operators")
        af_py_mod = types.ModuleType("airflow.operators.python")
        af_bash_mod = types.ModuleType("airflow.operators.bash")
        af_py_mod.PythonOperator = MagicMock
        af_bash_mod.BashOperator = MagicMock
        sys.modules["airflow"] = af_mod
        sys.modules["airflow.operators"] = af_op_mod
        sys.modules["airflow.operators.python"] = af_py_mod
        sys.modules["airflow.operators.bash"] = af_bash_mod

# 3. Mock 'pydantic' if missing
if "pydantic" not in sys.modules:
    try:
        import pydantic
    except ImportError:
        pyd_mod = types.ModuleType("pydantic")
        class BaseModel:
            def __init__(self, **kwargs):
                for k, v in kwargs.items():
                    setattr(self, k, v)
        pyd_mod.BaseModel = BaseModel
        pyd_mod.Field = lambda *args, **kwargs: None
        sys.modules["pydantic"] = pyd_mod

# 4. Mock / Lightweight fallback for 'pandas'
try:
    import pandas as pd
except ImportError:
    class MockSeries:
        def __init__(self, values: list, name: str = ""):
            self.values = list(values)
            self.name = name

        def __len__(self):
            return len(self.values)

        def __getitem__(self, idx):
            return self.values[idx]

        @property
        def iloc(self):
            return self

        @property
        def str(self):
            class StrAccessor:
                def __init__(self, s):
                    self.s = s

                def strip(self):
                    return MockSeries([str(v).strip() if v is not None else None for v in self.s.values])

                def upper(self):
                    return MockSeries([str(v).upper() if v is not None else None for v in self.s.values])

                def len(self):
                    return MockSeries([len(str(v)) if v is not None else 0 for v in self.s.values])

            return StrAccessor(self)

        def astype(self, dtype):
            if dtype == str:
                return MockSeries([str(v) if v is not None else "" for v in self.values])
            if dtype == float:
                return MockSeries([float(v) if v is not None else None for v in self.values])
            return self

        def replace(self, to_replace):
            new_vals = []
            for v in self.values:
                if isinstance(to_replace, dict) and v in to_replace:
                    new_vals.append(to_replace[v])
                else:
                    new_vals.append(v)
            return MockSeries(new_vals)

        def __gt__(self, other):
            return [bool(v is not None and v > other) for v in self.values]

        def __ge__(self, other):
            return [bool(v is not None and v >= other) for v in self.values]

        def __eq__(self, other):
            return [bool(v == other) for v in self.values]


    class MockDataFrame:
        def __init__(self, data=None, columns=None):
            if data is None:
                self._rows = []
                self._columns = list(columns) if columns else []
            elif isinstance(data, list):
                self._rows = [dict(r) for r in data]
                if columns:
                    self._columns = list(columns)
                elif self._rows:
                    self._columns = list(self._rows[0].keys())
                else:
                    self._columns = []
            elif isinstance(data, dict):
                # dict of lists
                col_names = list(data.keys())
                num_rows = len(data[col_names[0]]) if col_names else 0
                self._rows = []
                for i in range(num_rows):
                    row = {c: data[c][i] for c in col_names}
                    self._rows.append(row)
                self._columns = col_names
            else:
                self._rows = []
                self._columns = []

        @property
        def empty(self) -> bool:
            return len(self._rows) == 0

        @property
        def columns(self):
            return self._columns

        @columns.setter
        def columns(self, new_cols):
            old_cols = list(self._columns)
            self._columns = list(new_cols)
            col_map = dict(zip(old_cols, new_cols))
            for row in self._rows:
                for old_c, new_c in col_map.items():
                    if old_c in row and old_c != new_c:
                        row[new_c] = row.pop(old_c)

        def __len__(self):
            return len(self._rows)

        @property
        def iloc(self):
            class IlocIndexer:
                def __init__(self, df):
                    self.df = df

                def __getitem__(self, idx):
                    return self.df._rows[idx]

            return IlocIndexer(self)

        def __getitem__(self, key):
            if isinstance(key, str):
                vals = [r.get(key) for r in self._rows]
                return MockSeries(vals, name=key)
            elif isinstance(key, list):
                if key and isinstance(key[0], bool):
                    # Boolean mask indexing
                    filtered = [r for r, mask in zip(self._rows, key) if mask]
                    return MockDataFrame(filtered, columns=self._columns)
                elif key and isinstance(key[0], str):
                    # Multiple columns selection
                    projected = [{c: r.get(c) for c in key} for r in self._rows]
                    return MockDataFrame(projected, columns=key)
                return MockDataFrame([], columns=self._columns)
            return self

        def __setitem__(self, key, value):
            if isinstance(value, MockSeries):
                vals = value.values
                for i, r in enumerate(self._rows):
                    r[key] = vals[i] if i < len(vals) else None
            elif isinstance(value, list):
                for i, r in enumerate(self._rows):
                    r[key] = value[i] if i < len(value) else None
            else:
                for r in self._rows:
                    r[key] = value
            if key not in self._columns:
                self._columns.append(key)

        def select_dtypes(self, include=None):
            return self

        def dropna(self, subset=None):
            if subset is None:
                subset = self._columns
            filtered = []
            for r in self._rows:
                has_null = False
                for col in subset:
                    val = r.get(col)
                    if val is None or val == "" or (isinstance(val, float) and val != val):
                        has_null = True
                        break
                if not has_null:
                    filtered.append(dict(r))
            return MockDataFrame(filtered, columns=self._columns)

        def sort_values(self, by, ascending=True):
            sort_key = by if isinstance(by, str) else by[0]
            def _get_key(r):
                val = r.get(sort_key)
                if val is None:
                    return ""
                return str(val)
            sorted_rows = sorted(self._rows, key=_get_key, reverse=not ascending)
            return MockDataFrame(sorted_rows, columns=self._columns)

        def drop_duplicates(self, subset=None, keep="last"):
            if subset is None:
                subset = self._columns
            seen = {}
            ordered = []
            rows_iter = reversed(self._rows) if keep == "last" else self._rows
            for r in rows_iter:
                key = tuple(r.get(c) for c in subset)
                if key not in seen:
                    seen[key] = True
                    ordered.append(r)
            if keep == "last":
                ordered.reverse()
            return MockDataFrame(ordered, columns=self._columns)

        def reset_index(self, drop=True):
            return self

        def copy(self):
            return MockDataFrame([dict(r) for r in self._rows], columns=list(self._columns))


    def mock_read_csv(filepath_or_buffer, dtype=None):
        if hasattr(filepath_or_buffer, "read"):
            content = filepath_or_buffer.read()
            if isinstance(content, bytes):
                content = content.decode("utf-8")
        else:
            with open(filepath_or_buffer, "r", encoding="utf-8") as f:
                content = f.read()

        if not content.strip():
            return MockDataFrame([])

        reader = csv.DictReader(io.StringIO(content))
        rows = [dict(row) for row in reader]
        return MockDataFrame(rows, columns=reader.fieldnames or [])


    def mock_to_numeric(series, errors="coerce"):
        vals = []
        for v in series.values:
            try:
                vals.append(float(v))
            except (ValueError, TypeError):
                vals.append(None)
        return MockSeries(vals)


    def mock_to_datetime(series_or_val, errors="coerce", utc=True):
        if isinstance(series_or_val, (MockSeries, list)):
            vals = series_or_val.values if isinstance(series_or_val, MockSeries) else series_or_val
            out = []
            for v in vals:
                if isinstance(v, datetime):
                    out.append(v)
                elif isinstance(v, str) and v.strip():
                    try:
                        clean_v = v.strip().replace("Z", "+00:00")
                        dt = datetime.fromisoformat(clean_v)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        out.append(dt)
                    except Exception:
                        out.append(None)
                else:
                    out.append(None)
            return MockSeries(out)
        elif isinstance(series_or_val, datetime):
            return series_or_val
        elif isinstance(series_or_val, str):
            try:
                clean_v = series_or_val.strip().replace("Z", "+00:00")
                dt = datetime.fromisoformat(clean_v)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except Exception:
                return None
        return None


    def mock_timestamp(val):
        if isinstance(val, datetime):
            return val
        if isinstance(val, str):
            clean_v = val.strip().replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_v)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        return datetime.now(timezone.utc)


    def mock_notnull(val):
        return val is not None and val != ""


    pd_mock = types.ModuleType("pandas")
    pd_mock.DataFrame = MockDataFrame
    pd_mock.Series = MockSeries
    pd_mock.read_csv = mock_read_csv
    pd_mock.to_numeric = mock_to_numeric
    pd_mock.to_datetime = mock_to_datetime
    pd_mock.Timestamp = mock_timestamp
    pd_mock.notnull = mock_notnull

    sys.modules["pandas"] = pd_mock
