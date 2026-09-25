"""Data models and schemas for the ETL pipeline."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class TourRecord(BaseModel):
    """Schema definition for an individual tour record."""
    model_config = ConfigDict(populate_by_name=True)

    rank: Optional[int] = Field(default=None, description="Tour ranking by gross revenue")
    peak: Optional[int] = Field(default=None, description="Peak chart or box office position")
    all_time_peak: Optional[int] = Field(default=None, description="All-time peak ranking position")
    actual_gross: Optional[int] = Field(default=None, description="Actual gross revenue in USD")
    adjusted_gross_2022_dollars: Optional[int] = Field(default=None, description="Adjusted gross revenue in 2022 USD")
    artist: Optional[str] = Field(default=None, description="Touring artist or band name")
    tour_title: Optional[str] = Field(default=None, description="Title of the concert tour")
    years: Optional[str] = Field(default=None, description="Years the tour was active")
    shows: Optional[int] = Field(default=None, description="Total number of shows performed")
    average_gross: Optional[int] = Field(default=None, description="Average gross revenue per show in USD")
    ref: Optional[str] = Field(default=None, description="Reference citations")
    ingested_at: Optional[datetime] = Field(default=None, alias="_ingested_at", description="Timestamp when record was ingested into BigQuery")


class ExtractionSummary(BaseModel):
    """Metrics from the extraction stage."""
    source_uri: str
    raw_row_count: int
    raw_columns: List[str]
    file_size_bytes: int = 0


class TransformationSummary(BaseModel):
    """Metrics from the transformation stage."""
    transformed_row_count: int
    transformed_columns: List[str]
    sorted_by: str
    null_ranks_count: int


class LoadSummary(BaseModel):
    """Metrics from the loading stage."""
    target_table: str
    rows_loaded: int
    job_id: str
    write_disposition: str


class PipelineResult(BaseModel):
    """End-to-end execution result and metrics."""
    status: str
    extraction: ExtractionSummary
    transformation: TransformationSummary
    load: LoadSummary
    duration_seconds: float
    error_message: Optional[str] = None
