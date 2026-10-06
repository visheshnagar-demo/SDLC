from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr


# ================= User / Auth Schemas =================
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "Patient"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# ================= Patient Schemas =================
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    phone: str
    email: EmailStr
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    insurance_status: Optional[str] = "Active"
    allergies: Optional[str] = None


class PatientCreate(PatientBase):
    mrn: Optional[str] = None
    user_id: Optional[str] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    insurance_status: Optional[str] = None
    allergies: Optional[str] = None


class PatientResponse(PatientBase):
    id: str
    mrn: str
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ================= Doctor Schemas =================
class DoctorBase(BaseModel):
    name: str
    specialty: str
    department: str
    consultation_fee: float = 100.0
    available_days: Optional[str] = "Mon,Tue,Wed,Thu,Fri"
    slot_duration_minutes: Optional[int] = 30


class DoctorCreate(DoctorBase):
    user_id: Optional[str] = None


class DoctorResponse(DoctorBase):
    id: str
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ================= Appointment Schemas =================
class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: str
    start_time: str
    end_time: str
    reason: Optional[str] = None
    appointment_type: Optional[str] = "Consultation / Routine Checkup"


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentStatusUpdate(BaseModel):
    status: str  # Scheduled, In Progress, Completed, Cancelled


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None
    appointment_type: Optional[str] = None
    status: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: str
    status: str
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# ================= Prescription & Lab Order Schemas =================
class PrescriptionBase(BaseModel):
    medication: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    encounter_id: Optional[str] = None
    patient_id: Optional[str] = None


class PrescriptionResponse(PrescriptionBase):
    id: str
    encounter_id: str
    patient_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LabOrderBase(BaseModel):
    test_name: str
    priority: Optional[str] = "Routine"
    notes: Optional[str] = None


class LabOrderCreate(LabOrderBase):
    encounter_id: Optional[str] = None
    patient_id: Optional[str] = None


class LabOrderResponse(LabOrderBase):
    id: str
    encounter_id: str
    patient_id: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ================= Clinical Encounter Schemas =================
class ClinicalEncounterBase(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    diagnosis_codes: Optional[List[str]] = None


class ClinicalEncounterCreate(ClinicalEncounterBase):
    prescriptions: Optional[List[PrescriptionBase]] = []
    lab_orders: Optional[List[LabOrderBase]] = []


class ClinicalEncounterUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    diagnosis_codes: Optional[List[str]] = None
    status: Optional[str] = None


class ClinicalEncounterResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    clinical_notes: Optional[str] = None
    vitals: Optional[Any] = None
    diagnosis_codes: Optional[Any] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    prescriptions: Optional[List[PrescriptionResponse]] = []
    lab_orders: Optional[List[LabOrderResponse]] = []
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# ================= Billing & Invoice Schemas =================
class InvoiceItemBase(BaseModel):
    description: str
    cpt_code: Optional[str] = None
    amount: float


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: str
    invoice_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    patient_id: str
    encounter_id: Optional[str] = None
    total_amount: float
    copay_amount: Optional[float] = 0.0
    due_date: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = []


class InvoiceResponse(BaseModel):
    id: str
    encounter_id: Optional[str] = None
    patient_id: str
    total_amount: float
    copay_amount: float
    patient_balance: float
    status: str
    due_date: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: Optional[List[InvoiceItemResponse]] = []
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True


class PaymentProcess(BaseModel):
    amount_paid: float
    payment_method: Optional[str] = "Credit Card"
    cardholder_name: Optional[str] = None
    card_number: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None
    transaction_reference: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount_paid: float
    payment_method: str
    cardholder_name: Optional[str] = None
    transaction_reference: Optional[str] = None
    payment_status: str
    payment_date: Optional[datetime] = None

    class Config:
        from_attributes = True
