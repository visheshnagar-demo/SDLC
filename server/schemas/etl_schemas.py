"""Pydantic schemas for ETL pipeline data contracts and API interfaces."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class RawTestDataRecord(BaseModel):
    id: str
    payload_data: Optional[str] = None
    status: Optional[str] = None
    source_created_at: Optional[datetime] = None


class CleanedPostgresTest5Record(BaseModel):
    id: str
    payload_data: Optional[str] = None
    status: str = "UNKNOWN"
    source_created_at: Optional[datetime] = None
    etl_loaded_at: datetime = Field(default_factory=datetime.utcnow)
    etl_batch_id: str


class DeadLetterRecord(BaseModel):
    id: str
    source_record_id: Optional[str] = None
    raw_record: str
    rejection_reason: str
    batch_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ETLRunRequest(BaseModel):
    write_disposition: Literal["WRITE_APPEND", "WRITE_TRUNCATE", "WRITE_EMPTY"] = "WRITE_APPEND"
    batch_size: int = Field(default=5000, ge=1, le=50000)
    force_full_refresh: bool = False


class ETLRunResponse(BaseModel):
    status: str
    batch_id: str
    records_extracted: int
    records_cleaned: int
    records_rejected: int
    records_loaded: int
    target_table: str = "analytics.postgres_test5"
    duration_seconds: float


class ETLHealthResponse(BaseModel):
    status: str
    source_connected: bool
    target_connected: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)
