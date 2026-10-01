from fastapi import APIRouter
from server.app.api.v1.appointments import router as appointments_router
from server.app.api.v1.audit import router as audit_router
from server.app.api.v1.auth import router as auth_router
from server.app.api.v1.medical_records import router as medical_records_router
from server.app.api.v1.patients import router as patients_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(appointments_router)
api_router.include_router(medical_records_router)
api_router.include_router(audit_router)
