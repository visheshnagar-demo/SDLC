from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas.alert import LowStockAlertResponse
from server.routers.inventory import list_low_stock_items

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[LowStockAlertResponse])
@router.get("/low-stock", response_model=List[LowStockAlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return list_low_stock_items(db=db)
