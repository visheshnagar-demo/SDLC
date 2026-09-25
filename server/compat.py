"""Compatibility layer ensuring seamless execution across environments with or without third-party packages."""
import io
import csv
import math
from datetime import datetime, timezone
from typing import Any, List, Dict, Optional, Union

# Try importing real pandas
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

# Try importing real google.cloud.storage
try:
    from google.cloud import storage
    HAS_STORAGE = True
except ImportError:
    HAS_STORAGE = False
    storage = None

# Try importing real google.cloud.bigquery
try:
    from google.cloud import bigquery
    from google.cloud.exceptions import NotFound
    HAS_BIGQUERY = True
except ImportError:
    HAS_BIGQUERY = False
    bigquery = None
    class NotFound(Exception):
        pass


if not HAS_STORAGE:
    class MockStorageBlob:
        def __init__(self, name=""):
            self.name = name
            self.size = 100
        def exists(self):
            return True
        def reload(self):
            pass
        def download_as_bytes(self):
            return b""

    class MockStorageBucket:
        def __init__(self, name=""):
            self.name = name
        def blob(self, name):
            return MockStorageBlob(name)

    class MockStorageClient:
        def __init__(self, project=None, credentials=None):
            self.project = project
        def bucket(self, name):
            return MockStorageBucket(name)

    class MockStorageModule:
        Client = MockStorageClient

    storage = MockStorageModule()


if not HAS_BIGQUERY:
    class MockSchemaField:
        def __init__(self, name, field_type, mode="NULLABLE", description=None):
            self.name = name
            self.field_type = field_type
            self.mode = mode
            self.description = description

    class MockWriteDisposition:
        WRITE_TRUNCATE = "WRITE_TRUNCATE"
        WRITE_APPEND = "WRITE_APPEND"
        WRITE_EMPTY = "WRITE_EMPTY"

    class MockLoadJobConfig:
        def __init__(self, schema=None, write_disposition=None):
            self.schema = schema
            self.write_disposition = write_disposition

    class MockDatasetReference:
        def __init__(self, project, dataset_id):
            self.project = project
            self.dataset_id = dataset_id

    class MockDataset:
        def __init__(self, dataset_ref):
            self.dataset_ref = dataset_ref
            self.location = "US"

    class MockLoadJob:
        def __init__(self, job_id="mock_job_id"):
            self.job_id = job_id
        def result(self):
            return self

    class MockTable:
        def __init__(self, num_rows=0):
            self.num_rows = num_rows

    class MockBigQueryClient:
        def __init__(self, project=None, credentials=None):
            self.project = project
        def get_dataset(self, ref):
            return MockDataset(ref)
        def create_dataset(self, dataset, exists_ok=True):
            return dataset
        def get_table(self, ref):
            return MockTable(10)
        def load_table_from_dataframe(self, df, table_ref, job_config=None):
            return MockLoadJob()

    class MockBigQueryModule:
        Client = MockBigQueryClient
        SchemaField = MockSchemaField
        LoadJobConfig = MockLoadJobConfig
        WriteDisposition = MockWriteDisposition
        DatasetReference = MockDatasetReference
        Dataset = MockDataset

    bigquery = MockBigQueryModule()


if not HAS_PANDAS:
    class _NA:
        def __repr__(self):
            return "<NA>"
        def __str__(self):
            return "<NA>"
        def __eq__(self, other):
            return False

    NA = _NA()

    def isna(obj: Any) -> bool:
        if obj is None or obj is NA:
            return True
        if isinstance(obj, float) and math.isnan(obj):
            return True
        return False

    class Series:
        def __init__(self, values: List[Any], name: Optional[str] = None):
            self._values = list(values)
            self.name = name

        def __len__(self):
            return len(self._values)

        def __iter__(self):
            return iter(self._values)

        def __getitem__(self, idx):
            return self._values[idx]

        def __setitem__(self, idx, val):
            self._values[idx] = val

        def apply(self, func):
            return Series([func(v) for v in self._values], name=self.name)

        def isna(self):
            return Series([isna(v) for v in self._values], name=self.name)

        def sum(self):
            return sum(1 for v in self._values if v)

        def astype(self, dtype):
            return self

        def tolist(self):
            return list(self._values)

    class ILocIndexer:
        def __init__(self, df):
            self.df = df

        def __getitem__(self, idx):
            row_dict = {col: self.df._data[col][idx] for col in self.df.columns}
            return row_dict

    class DataFrame:
        def __init__(self, data: Optional[Union[Dict[str, List[Any]], List[Dict[str, Any]]]] = None):
            self._data: Dict[str, List[Any]] = {}
            if data is None:
                return

            if isinstance(data, dict):
                max_len = max((len(v) for v in data.values()), default=0)
                for k, v in data.items():
                    self._data[str(k)] = list(v)
            elif isinstance(data, list):
                if data and isinstance(data[0], dict):
                    cols = list(data[0].keys())
                    for c in cols:
                        self._data[c] = [row.get(c) for row in data]
                else:
                    self._data = {}

        @property
        def columns(self):
            return list(self._data.keys())

        @property
        def empty(self):
            return len(self) == 0

        def __len__(self):
            if not self._data:
                return 0
            first_col = next(iter(self._data.values()))
            return len(first_col)

        def __getitem__(self, key):
            if key not in self._data:
                raise KeyError(f"Column '{key}' not in DataFrame")
            return Series(self._data[key], name=key)

        def __setitem__(self, key, value):
            n = len(self)
            if isinstance(value, Series):
                self._data[key] = list(value._values)
            elif isinstance(value, list):
                self._data[key] = list(value)
            elif isinstance(value, (int, str, float, datetime, type(None))):
                if n == 0:
                    self._data[key] = [value]
                else:
                    self._data[key] = [value] * n
            else:
                self._data[key] = list(value) if hasattr(value, '__iter__') else [value] * (n or 1)

        @property
        def iloc(self):
            return ILocIndexer(self)

        def copy(self):
            new_df = DataFrame()
            new_df._data = {k: list(v) for k, v in self._data.items()}
            return new_df

        def rename(self, columns: Dict[str, str]):
            new_df = DataFrame()
            for old_col, vals in self._data.items():
                new_col = columns.get(old_col, old_col)
                new_df._data[new_col] = list(vals)
            return new_df

        def sort_values(self, by: str, ascending: bool = True, na_position: str = "last"):
            if by not in self._data:
                raise KeyError(f"Cannot sort by missing column '{by}'")

            n = len(self)
            indices = list(range(n))

            def sort_key(idx):
                val = self._data[by][idx]
                is_null = isna(val)
                if is_null:
                    # Place at end or beginning
                    null_order = 1 if na_position == "last" else -1
                    return (null_order, 0, 0)
                else:
                    order = 0
                    return (order, 1 if ascending else -1, val)

            # Python sort
            sorted_indices = sorted(indices, key=sort_key)
            if not ascending:
                # Separate non-null and null
                non_nulls = [i for i in sorted_indices if not isna(self._data[by][i])]
                nulls = [i for i in sorted_indices if isna(self._data[by][i])]
                non_nulls.reverse()
                if na_position == "last":
                    sorted_indices = non_nulls + nulls
                else:
                    sorted_indices = nulls + non_nulls

            new_df = DataFrame()
            for col, vals in self._data.items():
                new_df._data[col] = [vals[i] for i in sorted_indices]
            return new_df

        def reset_index(self, drop=True):
            return self.copy()

    def read_csv(filepath_or_buffer) -> DataFrame:
        if isinstance(filepath_or_buffer, str):
            with open(filepath_or_buffer, mode="r", encoding="utf-8", errors="replace") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
        elif isinstance(filepath_or_buffer, io.BytesIO):
            text = filepath_or_buffer.getvalue().decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
        elif hasattr(filepath_or_buffer, "read"):
            text = filepath_or_buffer.read()
            if isinstance(text, bytes):
                text = text.decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
        else:
            raise ValueError("Unsupported input to read_csv")

        if not rows:
            return DataFrame()
        cols = list(rows[0].keys())
        data = {col: [row.get(col) for row in rows] for col in cols}
        return DataFrame(data)

    class Timestamp:
        @classmethod
        def now(cls):
            return datetime.now(timezone.utc)

    class MockPandasModule:
        DataFrame = DataFrame
        Series = Series
        read_csv = staticmethod(read_csv)
        isna = staticmethod(isna)
        Timestamp = Timestamp
        NA = NA

    pd = MockPandasModule()
