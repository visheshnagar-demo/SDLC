"""Data cleansing, sanitization, and type coercion transformer."""
import numpy as np
import pandas as pd
from server.config import ETLConfig
from server.utils.logger import get_logger
from server.utils.exceptions import TransformationError

logger = get_logger("sdlc-etl-transformer")


class DataCleanerTransformer:
    """Cleans raw extracted records, strips whitespace, sanitizes nulls, and coerces types."""

    def __init__(self, config: ETLConfig):
        self.config = config

    def strip_whitespace_and_sanitize_nulls(self, df: pd.DataFrame) -> pd.DataFrame:
        """Trims leading/trailing whitespace and converts placeholder null strings to None."""
        if df is None:
            return df

        cleaned_df = df.copy()

        null_equivalents = {
            "nan",
            "NaN",
            "None",
            "none",
            "null",
            "NULL",
            "N/A",
            "n/a",
            "",
        }

        for col in cleaned_df.columns:
            if col in cleaned_df.select_dtypes(include=["object", "string"]).columns:
                def _clean_val(x):
                    if x is None or pd.isna(x):
                        return None
                    if isinstance(x, (bool, np.bool_)):
                        return True if bool(x) else False
                    s = str(x).strip()
                    if s in null_equivalents:
                        return None
                    return s

                cleaned_df[col] = cleaned_df[col].apply(_clean_val)

        return cleaned_df

    def coerce_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Coerces columns to their target schema types."""
        if df is None:
            return df

        transformed_df = df.copy()

        if "id" in transformed_df.columns:
            transformed_df["id"] = transformed_df["id"].apply(
                lambda x: str(x).strip() if x is not None and not pd.isna(x) and str(x).strip() not in ["", "None", "nan", "null", "NULL", "NaN"] else None
            )

        if "raw_text" in transformed_df.columns:
            transformed_df["raw_text"] = transformed_df["raw_text"].apply(
                lambda x: str(x).strip() if x is not None and not pd.isna(x) and str(x).strip() not in ["", "None", "nan", "null", "NULL", "NaN"] else None
            )

        if "numeric_val" in transformed_df.columns:
            transformed_df["numeric_val"] = pd.to_numeric(
                transformed_df["numeric_val"], errors="coerce"
            )

        if "is_active" in transformed_df.columns:
            def parse_bool(val):
                if val is None or pd.isna(val):
                    return None
                if isinstance(val, (bool, np.bool_)):
                    return True if bool(val) else False
                s = str(val).strip().lower()
                if s in ["true", "1", "1.0", "t", "yes", "y"]:
                    return True
                if s in ["false", "0", "0.0", "f", "no", "n"]:
                    return False
                return None

            bool_vals = [parse_bool(v) for v in transformed_df["is_active"]]
            transformed_df.drop(columns=["is_active"], inplace=True)
            transformed_df["is_active"] = pd.Series(
                bool_vals, index=transformed_df.index, dtype=object
            )

        if "created_at" in transformed_df.columns:
            def parse_ts(val):
                if val is None or pd.isna(val):
                    return pd.NaT
                s = str(val).strip()
                if s in ["", "None", "nan", "null", "NULL", "NaN", "NaT"]:
                    return pd.NaT
                res = pd.to_datetime(val, errors="coerce")
                return res if not pd.isna(res) else pd.NaT

            transformed_df["created_at"] = transformed_df["created_at"].apply(parse_ts)

        return transformed_df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Executes the full transformation pipeline on the input DataFrame."""
        if df is None:
            raise TransformationError("Input DataFrame cannot be None.")

        raw_count = len(df)
        if raw_count == 0:
            logger.warning("Input DataFrame is empty. Skipping transformation.")
            return df

        logger.info("Transforming %d raw records...", raw_count)

        try:
            # Step 1: Whitespace stripping & null sanitization
            sanitized_df = self.strip_whitespace_and_sanitize_nulls(df)

            # Step 2: Type coercion
            coerced_df = self.coerce_types(sanitized_df)

            # Step 3: Remove fully null records
            valid_df = coerced_df.dropna(how="all").copy()
            quarantined_count = raw_count - len(valid_df)

            if quarantined_count > 0:
                logger.warning("Quarantined %d completely empty rows.", quarantined_count)

            if raw_count > 0 and len(valid_df) == 0:
                raise TransformationError(
                    f"Fatal: 100% of {raw_count} extracted rows failed validation or were empty."
                )

            if "is_active" in valid_df.columns:
                def _to_strict_bool(val):
                    if val is None or pd.isna(val):
                        return None
                    if isinstance(val, (bool, np.bool_)):
                        return True if bool(val) else False
                    s = str(val).strip().lower()
                    if s in ["true", "1", "1.0", "t", "yes", "y"]:
                        return True
                    if s in ["false", "0", "0.0", "f", "no", "n"]:
                        return False
                    return None

                final_bools = [_to_strict_bool(v) for v in valid_df["is_active"]]
                valid_df.drop(columns=["is_active"], inplace=True)
                valid_df["is_active"] = pd.Series(final_bools, index=valid_df.index, dtype=object)

            logger.info(
                "Transformation complete: %d raw records -> %d clean valid records.",
                raw_count,
                len(valid_df),
            )
            return valid_df

        except TransformationError:
            raise
        except Exception as exc:
            raise TransformationError(f"Unexpected transformation failure: {exc}") from exc
