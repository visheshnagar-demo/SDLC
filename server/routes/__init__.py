from fastapi import APIRouter
from server.routes.auth import router as auth_router
from server.routes.patient import router as patient_router
from server.routes.doctor import router as doctor_router
from server.routes.appointment import router as appointment_router
from server.routes.clinical_record import router as clinical_record_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patient_router)
api_router.include_router(doctor_router)
api_router.include_router(appointment_router)
api_router.include_router(clinical_record_router)

__all__ = ["api_router"]
