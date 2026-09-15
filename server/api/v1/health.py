from typing import Dict
from fastapi import APIRouter

router = APIRouter()


@router.get("/health", response_model=Dict[str, str])
def health_check():
    return {
        "status": "healthy",
        "service": "unisex-gym-backend",
        "version": "1.0.0",
    }
