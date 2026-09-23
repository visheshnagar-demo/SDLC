from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server.schemas import ShareResponse
from server.services.itinerary_service import ItineraryService
from server.services.export_service import ExportService

router = APIRouter()


@router.get(
    "/{id}/export/pdf",
    summary="Download Formatted PDF Itinerary",
)
def export_pdf(
    id: str,
    db: Session = Depends(get_db),
):
    itinerary = ItineraryService.get_itinerary_by_id(id, db)
    pdf_bytes = ExportService.export_pdf(itinerary)
    sanitized_dest = "".join(
        c for c in itinerary.destination if c.isalnum() or c in ("-", "_")
    ).rstrip()
    filename = f"itinerary-{sanitized_dest or id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/{id}/export/ics",
    summary="Download iCalendar (.ics) File",
)
def export_ics(
    id: str,
    db: Session = Depends(get_db),
):
    itinerary = ItineraryService.get_itinerary_by_id(id, db)
    ics_bytes = ExportService.export_ics(itinerary)
    sanitized_dest = "".join(
        c for c in itinerary.destination if c.isalnum() or c in ("-", "_")
    ).rstrip()
    filename = f"itinerary-{sanitized_dest or id}.ics"
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/{id}/share",
    response_model=ShareResponse,
    summary="Generate Public Shareable Token and Link",
)
def share_itinerary(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    itinerary = ItineraryService.get_itinerary_by_id(id, db)
    base_url = str(request.base_url).rstrip("/")
    share_url = f"{base_url}/shared/{itinerary.share_token}"
    return ShareResponse(
        share_token=itinerary.share_token,
        share_url=share_url,
    )
