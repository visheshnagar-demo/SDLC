from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from server.database import get_db
from server.schemas import ShareResponse
from server.services.itinerary_service import ItineraryService
from server.services.export_service import ExportService

router = APIRouter(
    prefix="/api/v1/itineraries/{itinerary_id}", tags=["Export & Sharing"]
)


@router.get("/export/pdf")
def export_pdf(itinerary_id: str, db: Session = Depends(get_db)):
    itinerary = ItineraryService.get_itinerary(itinerary_id, db)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found",
        )
    pdf_bytes = ExportService.generate_pdf(itinerary)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="itinerary-{itinerary_id}.pdf"'
        },
    )


@router.get("/export/ics")
def export_ics(itinerary_id: str, db: Session = Depends(get_db)):
    itinerary = ItineraryService.get_itinerary(itinerary_id, db)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found",
        )
    ics_bytes = ExportService.generate_ics(itinerary)
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="itinerary-{itinerary_id}.ics"'
        },
    )


@router.post("/share", response_model=ShareResponse)
def share_itinerary(itinerary_id: str, request: Request, db: Session = Depends(get_db)):
    itinerary = ItineraryService.get_itinerary(itinerary_id, db)
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found",
        )
    token = ExportService.generate_share_token(itinerary, db)
    base_url = str(request.base_url).rstrip("/")
    return ShareResponse(share_token=token, share_url=f"{base_url}/shared/{token}")
