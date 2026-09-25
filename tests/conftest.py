"""Test configuration and fallback mocks for environment without heavy ETL libraries."""
import sys
from unittest.mock import MagicMock

# 1. Fallback for google.cloud.exceptions
if "google.cloud.exceptions" not in sys.modules:
    try:
        import google.cloud.exceptions
    except ImportError:
        class NotFound(Exception):
            pass
        exc_mod = MagicMock()
        exc_mod.NotFound = NotFound
        sys.modules["google.cloud.exceptions"] = exc_mod

# 2. Fallback for google.cloud.bigquery
if "google.cloud.bigquery" not in sys.modules:
    try:
        import google.cloud.bigquery
    except ImportError:
        bq_mod = MagicMock()
        class SchemaField:
            def __init__(self, name, field_type, mode="NULLABLE", description=""):
                self.name = name
                self.field_type = field_type
                self.mode = mode
                self.description = description
        bq_mod.SchemaField = SchemaField
        class WriteDisposition:
            WRITE_APPEND = "WRITE_APPEND"
            WRITE_TRUNCATE = "WRITE_TRUNCATE"
            WRITE_EMPTY = "WRITE_EMPTY"
        class CreateDisposition:
            CREATE_IF_NEEDED = "CREATE_IF_NEEDED"
            CREATE_NEVER = "CREATE_NEVER"
        bq_mod.WriteDisposition = WriteDisposition
        bq_mod.CreateDisposition = CreateDisposition
        sys.modules["google.cloud.bigquery"] = bq_mod

# 3. Fallback for google.cloud.sql.connector
if "google.cloud.sql.connector" not in sys.modules:
    try:
        import google.cloud.sql.connector
    except ImportError:
        sql_conn_mod = MagicMock()
        class IPTypes:
            PRIVATE = "PRIVATE"
            PUBLIC = "PUBLIC"
        sql_conn_mod.IPTypes = IPTypes
        sql_conn_mod.Connector = MagicMock
        sys.modules["google.cloud.sql.connector"] = sql_conn_mod

# 4. Fallback for sqlalchemy
if "sqlalchemy" not in sys.modules:
    try:
        import sqlalchemy
    except ImportError:
        sa_mod = MagicMock()
        sys.modules["sqlalchemy"] = sa_mod

# 5. Fallback for pandas
if "pandas" not in sys.modules:
    try:
        import pandas as pd
    except ImportError:
        class MockSeries(list):
            def __init__(self, data=None):
                super().__init__(data or [])

            @property
            def str(self):
                class StringAccessor:
                    def __init__(self, series):
                        self._series = series
                    def strip(self):
                        return MockSeries([str(x).strip() if x is not None else None for x in self._series])
                return StringAccessor(self)

            def astype(self, dtype):
                if dtype == str:
                    return MockSeries([str(x) if x is not None else "None" for x in self])
                return self

            def replace(self, mapping):
                new_data = []
                for x in self:
                    val = mapping.get(x, x)
                    new_data.append(val)
                return MockSeries(new_data)

            def apply(self, func):
                return MockSeries([func(x) for x in self])

            def map(self, func):
                return MockSeries([func(x) for x in self])

            def sum(self):
                return sum(1 for x in self if x is True or (isinstance(x, (int, float)) and x != 0))

        class MockDataFrame:
            def __init__(self, data=None):
                self._data = {}
                if data:
                    if isinstance(data, dict):
                        for k, v in data.items():
                            self._data[k] = list(v)
                    elif isinstance(data, list):
                        if data and isinstance(data[0], dict):
                            keys = list(data[0].keys())
                            for k in keys:
                                self._data[k] = [row.get(k) for row in data]

            @property
            def columns(self):
                return list(self._data.keys())

            @columns.setter
            def columns(self, new_cols):
                old_cols = list(self._data.keys())
                new_dict = {}
                for old_c, new_c in zip(old_cols, new_cols):
                    new_dict[new_c] = self._data[old_c]
                self._data = new_dict

            @property
            def empty(self):
                return len(self) == 0

            def __len__(self):
                if not self._data:
                    return 0
                return len(next(iter(self._data.values())))

            def __getitem__(self, key):
                if isinstance(key, str):
                    return MockSeries(self._data.get(key, []))
                return None

            def __setitem__(self, key, value):
                if isinstance(value, list) or isinstance(value, MockSeries):
                    self._data[key] = list(value)
                else:
                    self._data[key] = [value] * len(self)

            def copy(self):
                new_df = MockDataFrame()
                new_df._data = {k: list(v) for k, v in self._data.items()}
                return new_df

            @property
            def iloc(self):
                class ILocAccessor:
                    def __init__(self, df):
                        self._df = df
                    def __getitem__(self, idx):
                        return {k: self._df._data[k][idx] for k in self._df._data}
                return ILocAccessor(self)

            def select_dtypes(self, include=None):
                return self.copy()

            def isna(self):
                res = MockDataFrame()
                for k, v in self._data.items():
                    res._data[k] = [x is None or x == "" or str(x).lower() in ("nan", "none", "null") for x in v]
                return res

            def sum(self):
                class SumResult:
                    def sum(self):
                        total = 0
                        for v in self._data.values():
                            total += sum(1 for x in v if x is True or (isinstance(x, (int, float)) and x != 0))
                        return total
                sr = SumResult()
                sr._data = self._data
                return sr

            def drop_duplicates(self):
                if not self._data:
                    return self.copy()
                seen = set()
                keep_indices = []
                n = len(self)
                cols = self.columns
                for i in range(n):
                    row_tuple = tuple(self._data[c][i] for c in cols)
                    if row_tuple not in seen:
                        seen.add(row_tuple)
                        keep_indices.append(i)
                new_df = MockDataFrame()
                for c in cols:
                    new_df._data[c] = [self._data[c][i] for i in keep_indices]
                return new_df

            def dropna(self, how="all"):
                if not self._data or how != "all":
                    return self.copy()
                keep_indices = []
                n = len(self)
                cols = self.columns
                for i in range(n):
                    row_vals = [self._data[c][i] for c in cols]
                    if not all(x is None or str(x).lower() in ("nan", "none", "null", "") for x in row_vals):
                        keep_indices.append(i)
                new_df = MockDataFrame()
                for c in cols:
                    new_df._data[c] = [self._data[c][i] for i in keep_indices]
                return new_df

            def reset_index(self, drop=True):
                return self

        class MockPandasModule:
            DataFrame = MockDataFrame
            Series = MockSeries

            @staticmethod
            def isna(val):
                return val is None or (isinstance(val, float) and val != val) or str(val).lower() in ("nan", "none", "null", "")

            @staticmethod
            def notna(val):
                return not MockPandasModule.isna(val)

            @staticmethod
            def to_datetime(s, errors="coerce", utc=True):
                return s

            @staticmethod
            def to_numeric(s, errors="coerce"):
                return s

            @staticmethod
            def read_sql(query, con):
                return MockDataFrame()

        sys.modules["pandas"] = MockPandasModule
