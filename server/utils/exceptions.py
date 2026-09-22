"""Custom domain exceptions for the ETL pipeline."""


class ETLException(Exception):
    """Base exception for all ETL pipeline errors."""
    pass


class ExtractionError(ETLException):
    """Raised when data extraction from Cloud SQL PostgreSQL fails."""
    pass


class TransformationError(ETLException):
    """Raised when data cleaning, validation, or transformation fails."""
    pass


class LoadError(ETLException):
    """Raised when loading data into BigQuery fails."""
    pass


class ConfigurationError(ETLException):
    """Raised when required environment configuration or credentials are missing."""
    pass
