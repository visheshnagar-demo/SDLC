from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from server.schemas.fitness_class import FitnessClassRead


class BookingCreate(BaseModel):
    class_id: str


class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    class_id: str
    status: str
    booked_at: datetime
    fitness_class: Optional[FitnessClassRead] = None
    class_title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    instructor_name: Optional[str] = None


class AttendeeRosterItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: str
    user_id: str
    full_name: str
    email: str
    phone_number: Optional[str] = None
    membership_status: Optional[str] = None
    booked_at: datetime
    status: str


class ClassRosterResponse(BaseModel):
    class_id: str
    class_title: str
    total_booked: int
    max_capacity: int
    attendees: List[AttendeeRosterItem]
