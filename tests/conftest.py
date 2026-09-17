"""Pytest configuration and robust lightweight fallbacks for environments without GCP/Pandas."""

import csv
from datetime import date, datetime, timezone
import io
import math
import sys
from typing import Any, Dict, List, Optional
from unittest.mock import MagicMock

try:
    import pandas as pd
except ImportError:
    class NAValue:
        def __repr__(self):
            return "<NA>"
        def __eq__(self, other):
            return isinstance(other, NAValue)

    NA = NAValue()

    class Series:
        def __init__(self, data: list, name: Optional[str] = None):
            self._data = list(data)
            self.name = name

        def __len__(self):
            return len(self._data)

        def __iter__(self):
            return iter(self._data)

        def __getitem__(self, idx):
            if isinstance(idx, Series):
                return Series([d for d, m in zip(self._data, idx._data) if m], self.name)
            return self._data[idx]

        def __eq__(self, other):
            if isinstance(other, Series):
                return Series([a == b for a, b in zip(self._data, other._data)])
            return Series([a == other for a in self._data])

        def __ne__(self, other):
            if isinstance(other, Series):
                return Series([a != b for a, b in zip(self._data, other._data)])
            return Series([a != other for a in self._data])

        def __and__(self, other):
            if isinstance(other, Series):
                return Series([bool(a and b) for a, b in zip(self._data, other._data)])
            return Series([bool(a and other) for a in self._data])

        @property
        def dtype(self):
            return "object"

        def apply(self, func):
            return Series([func(x) for x in self._data], self.name)

        def astype(self, target_type):
            if target_type == str:
                return Series([str(x) if x is not None else "" for x in self._data], self.name)
            return Series([target_type(x) for x in self._data], self.name)

        @property
        def str(self):
            class StrAccessor:
                def __init__(self, s):
                    self._s = s
                def upper(self):
                    return Series([str(x).upper() if x is not None else None for x in self._s._data], self._s.name)
            return StrAccessor(self)

        @property
        def dt(self):
            class DtAccessor:
                def __init__(self, s):
                    self._s = s
                @property
                def date(self):
                    res = []
                    for x in self._s._data:
                        if isinstance(x, (datetime, date)):
                            res.append(x.date() if isinstance(x, datetime) else x)
                        elif isinstance(x, str):
                            try:
                                res.append(datetime.fromisoformat(x.replace("Z", "+00:00")).date())
                            except Exception:
                                res.append(None)
                        else:
                            res.append(None)
                    return Series(res, self._s.name)
            return DtAccessor(self)

        def notna(self):
            return Series([x is not None and not (isinstance(x, float) and math.isnan(x)) and x is not NA for x in self._data], self.name)

        def fillna(self, val):
            if isinstance(val, Series):
                return Series([v if v is not None and v is not NA else f for v, f in zip(self._data, val._data)], self.name)
            return Series([v if v is not None and v is not NA else val for v in self._data], self.name)

        def any(self):
            return any(bool(x) for x in self._data)

    class DataFrame:
        def __init__(self, data=None):
            self._columns: List[str] = []
            self._rows: List[Dict[str, Any]] = []

            if data is None:
                return
            if isinstance(data, dict):
                self._columns = list(data.keys())
                num_rows = len(next(iter(data.values()))) if data else 0
                self._rows = []
                for i in range(num_rows):
                    row = {k: data[k][i] for k in self._columns}
                    self._rows.append(row)
            elif isinstance(data, list):
                if data and isinstance(data[0], dict):
                    self._columns = list(data[0].keys())
                    self._rows = [dict(r) for r in data]
                else:
                    self._rows = []

        @property
        def columns(self):
            return list(self._columns)

        @columns.setter
        def columns(self, cols):
            old_cols = self._columns
            self._columns = list(cols)
            new_rows = []
            for r in self._rows:
                new_row = {}
                for old_k, new_k in zip(old_cols, self._columns):
                    new_row[new_k] = r.get(old_k)
                new_rows.append(new_row)
            self._rows = new_rows

        @property
        def empty(self) -> bool:
            return len(self._rows) == 0

        def __len__(self):
            return len(self._rows)

        def copy(self):
            new_df = DataFrame()
            new_df._columns = list(self._columns)
            new_df._rows = [dict(r) for r in self._rows]
            return new_df

        def __getitem__(self, item):
            if isinstance(item, str):
                return Series([r.get(item) for r in self._rows], name=item)
            if isinstance(item, list):
                new_df = DataFrame()
                new_df._columns = list(item)
                new_df._rows = [{col: r.get(col) for col in item} for r in self._rows]
                return new_df
            if isinstance(item, Series):
                new_df = DataFrame()
                new_df._columns = list(self._columns)
                new_df._rows = [r for r, m in zip(self._rows, item._data) if m]
                return new_df
            raise KeyError(f"Unsupported key: {item}")

        def __setitem__(self, key, value):
            if key not in self._columns:
                self._columns.append(key)
            if isinstance(value, Series):
                val_list = value._data
                for i, r in enumerate(self._rows):
                    r[key] = val_list[i] if i < len(val_list) else None
            elif isinstance(value, list):
                for i, r in enumerate(self._rows):
                    r[key] = value[i] if i < len(value) else None
            else:
                for r in self._rows:
                    r[key] = value

        @property
        def iloc(self):
            class ILocIndexer:
                def __init__(self, df):
                    self._df = df
                def __getitem__(self, idx):
                    return self._df._rows[idx]
            return ILocIndexer(self)

        def sort_values(self, by, ascending=True, na_position="last"):
            by_cols = by if isinstance(by, list) else [by]
            asc_list = ascending if isinstance(ascending, list) else [ascending] * len(by_cols)

            def sort_key(row):
                keys = []
                for col, asc in zip(by_cols, asc_list):
                    val = row.get(col)
                    if val is None:
                        # For descending sort, None should sort last
                        keys.append(("",) if asc else (chr(0),))
                    else:
                        keys.append((str(val),))
                return keys

            # Simple sorting
            sorted_rows = list(self._rows)
            # Apply sorting per column in reverse order
            for col, asc in reversed(list(zip(by_cols, asc_list))):
                sorted_rows.sort(
                    key=lambda r: (
                        r.get(col) is None if (na_position == "last") else r.get(col) is not None,
                        r.get(col) if r.get(col) is not None else ""
                    ),
                    reverse=not asc
                )
            new_df = DataFrame()
            new_df._columns = list(self._columns)
            new_df._rows = sorted_rows
            return new_df

        def drop_duplicates(self, subset, keep="first"):
            seen = set()
            new_rows = []
            for r in self._rows:
                key = tuple(r.get(c) for c in subset)
                if key not in seen:
                    seen.add(key)
                    new_rows.append(r)
            new_df = DataFrame()
            new_df._columns = list(self._columns)
            new_df._rows = new_rows
            return new_df

    class Timestamp(datetime):
        def __new__(cls, *args, **kwargs):
            if len(args) == 1 and isinstance(args[0], str):
                s = args[0].replace("Z", "+00:00")
                dt = datetime.fromisoformat(s)
                return super().__new__(cls, dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.microsecond, tzinfo=dt.tzinfo or timezone.utc)
            if len(args) == 1 and isinstance(args[0], datetime):
                dt = args[0]
                return super().__new__(cls, dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.microsecond, tzinfo=dt.tzinfo or timezone.utc)
            return super().__new__(cls, *args, **kwargs)

        @classmethod
        def now(cls, tz=timezone.utc):
            if isinstance(tz, str) and tz.upper() == "UTC":
                tz_obj = timezone.utc
            elif isinstance(tz, str):
                tz_obj = timezone.utc
            else:
                tz_obj = tz
            dt = datetime.now(tz=tz_obj)
            return cls(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.microsecond, tzinfo=tz_obj)

    def read_csv(file_or_buffer, dtype=None, skipinitialspace=False):
        if isinstance(file_or_buffer, (io.BytesIO, io.StringIO)):
            text = file_or_buffer.getvalue()
            if isinstance(text, bytes):
                text = text.decode("utf-8")
            file_obj = io.StringIO(text)
        else:
            file_obj = file_or_buffer
        reader = csv.DictReader(file_obj, skipinitialspace=skipinitialspace)
        rows = list(reader)
        df = DataFrame(rows)
        return df

    def to_datetime(arg, errors="raise", utc=True):
        def parse_single(x):
            if x is None or x is NA or (isinstance(x, float) and math.isnan(x)):
                return None
            if isinstance(x, datetime):
                return x if x.tzinfo else x.replace(tzinfo=timezone.utc)
            if isinstance(x, date):
                return datetime(x.year, x.month, x.day, tzinfo=timezone.utc)
            try:
                dt = datetime.fromisoformat(str(x).replace("Z", "+00:00"))
                return dt
            except Exception:
                if errors == "coerce":
                    return None
                raise

        if isinstance(arg, Series):
            return Series([parse_single(x) for x in arg._data], arg.name)
        return parse_single(arg)

    def isna(val):
        if val is None or val is NA:
            return True
        if isinstance(val, float) and math.isnan(val):
            return True
        return False

    class MockPandasModule:
        DataFrame = DataFrame
        Series = Series
        Timestamp = Timestamp
        NA = NA
        read_csv = staticmethod(read_csv)
        to_datetime = staticmethod(to_datetime)
        isna = staticmethod(isna)

    sys.modules["pandas"] = MockPandasModule()

# Ensure google cloud packages can be imported or mocked
for module_name in [
    "google",
    "google.cloud",
    "google.cloud.storage",
    "google.cloud.bigquery",
    "google.cloud.exceptions",
    "google.cloud.logging",
    "pyarrow",
    "db_dtypes",
]:
    if module_name not in sys.modules:
        try:
            __import__(module_name)
        except ImportError:
            sys.modules[module_name] = MagicMock()

from google.cloud.exceptions import NotFound, GoogleCloudError
if isinstance(NotFound, MagicMock):
    class NotFound(Exception):
        pass
    class GoogleCloudError(Exception):
        pass
    sys.modules["google.cloud.exceptions"].NotFound = NotFound
    sys.modules["google.cloud.exceptions"].GoogleCloudError = GoogleCloudError
