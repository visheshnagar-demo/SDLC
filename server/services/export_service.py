import io
import uuid
import secrets
from datetime import datetime, date, time, timedelta, timezone
from sqlalchemy.orm import Session

from server.models import Itinerary


def _generate_fallback_pdf(itinerary: Itinerary) -> bytes:
    lines = [
        f"AI Travel Itinerary: {itinerary.destination}",
        f"Duration: {itinerary.duration_days} Days | Budget: {itinerary.currency} {itinerary.budget:,.2f} | Status: {itinerary.budget_status}",
        f"Total Estimated Cost: {itinerary.currency} {itinerary.total_estimated_cost:,.2f}",
        "-" * 50,
    ]
    for day in itinerary.days:
        lines.append(
            f"Day {day.day_number} (Daily Spend: {itinerary.currency} {day.daily_estimated_cost:,.2f})"
        )
        for act in day.activities:
            lines.append(
                f"  [{act.time_slot}] {act.title} ({act.category}) - {itinerary.currency} {act.estimated_cost:,.2f}"
            )
            if act.location:
                lines.append(f"    Location: {act.location}")
            if act.description:
                lines.append(f"    {act.description}")
        lines.append("")

    stream_data = "BT /F1 10 Tf 50 750 Td 12 TL\n"
    for line in lines[:55]:
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream_data += f"({escaped}) '\n"
    stream_data += "ET"

    stream_bytes = stream_data.encode("latin-1", errors="replace")
    stream_len = len(stream_bytes)

    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length "
        + str(stream_len).encode("ascii")
        + b" >>\nstream\n"
        + stream_bytes
        + b"\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n450\n%%EOF"
    )
    return pdf


def _generate_rfc5545_ics(itinerary: Itinerary) -> bytes:
    cal_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AI Travel Planner//SDLC Assistant//EN",
        f"X-WR-CALNAME:Trip to {itinerary.destination}",
    ]

    start_date = date.today() + timedelta(days=14)
    now_str = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    for day in itinerary.days:
        day_offset = day.day_number - 1
        trip_day_date = start_date + timedelta(days=day_offset)

        for act in day.activities:
            seq = act.sequence_order or 0
            start_hour = min(22, 9 + (seq * 3))
            start_dt = datetime.combine(
                trip_day_date, time(start_hour, 0), tzinfo=timezone.utc
            )
            duration = timedelta(minutes=act.duration_minutes or 60)
            end_dt = start_dt + duration

            dtstart_str = start_dt.strftime("%Y%m%dT%H%M%SZ")
            dtend_str = end_dt.strftime("%Y%m%dT%H%M%SZ")
            uid_str = f"{act.id or uuid.uuid4()}@wanderai.local"

            cal_lines.append("BEGIN:VEVENT")
            cal_lines.append(f"UID:{uid_str}")
            cal_lines.append(f"DTSTAMP:{now_str}")
            cal_lines.append(f"DTSTART:{dtstart_str}")
            cal_lines.append(f"DTEND:{dtend_str}")
            cal_lines.append(f"SUMMARY:{act.title} ({act.category})")
            if act.description:
                escaped_desc = act.description.replace("\n", "\\n").replace(",", "\\,")
                cal_lines.append(f"DESCRIPTION:{escaped_desc}")
            if act.location:
                cal_lines.append(f"LOCATION:{act.location}")
            cal_lines.append("END:VEVENT")

    cal_lines.append("END:VCALENDAR")
    return "\r\n".join(cal_lines).encode("utf-8")


class ExportService:
    @staticmethod
    def generate_pdf(itinerary: Itinerary) -> bytes:
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import (
                SimpleDocTemplate,
                Paragraph,
                Spacer,
                Table,
                TableStyle,
            )
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36,
            )

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "DocTitle",
                parent=styles["Heading1"],
                fontSize=22,
                leading=26,
                textColor=colors.HexColor("#4F46E5"),
                spaceAfter=8,
            )
            subtitle_style = ParagraphStyle(
                "DocSubTitle",
                parent=styles["Normal"],
                fontSize=11,
                leading=14,
                textColor=colors.HexColor("#4B5563"),
                spaceAfter=14,
            )
            day_header_style = ParagraphStyle(
                "DayHeader",
                parent=styles["Heading2"],
                fontSize=14,
                leading=18,
                textColor=colors.HexColor("#1F2937"),
                spaceBefore=10,
                spaceAfter=6,
            )
            body_style = styles["Normal"]

            elements = []
            elements.append(
                Paragraph(f"AI Travel Itinerary: {itinerary.destination}", title_style)
            )
            summary_text = (
                f"<b>Duration:</b> {itinerary.duration_days} Days &nbsp;|&nbsp; "
                f"<b>Total Budget:</b> {itinerary.currency} {itinerary.budget:,.2f} &nbsp;|&nbsp; "
                f"<b>Estimated Spend:</b> {itinerary.currency} {itinerary.total_estimated_cost:,.2f} &nbsp;|&nbsp; "
                f"<b>Status:</b> {itinerary.budget_status}"
            )
            elements.append(Paragraph(summary_text, subtitle_style))
            elements.append(Spacer(1, 10))

            for day in itinerary.days:
                elements.append(
                    Paragraph(
                        f"Day {day.day_number} — Estimated Spend: {itinerary.currency} {day.daily_estimated_cost:,.2f}",
                        day_header_style,
                    )
                )

                table_data = [
                    ["Time Slot", "Activity", "Category", "Location", "Est. Cost"]
                ]
                for act in day.activities:
                    table_data.append(
                        [
                            act.time_slot,
                            Paragraph(
                                f"<b>{act.title}</b><br/><font size=8>{act.description or ''}</font>",
                                body_style,
                            ),
                            act.category,
                            act.location or "",
                            f"{itinerary.currency} {act.estimated_cost:,.2f}",
                        ]
                    )

                t = Table(table_data, colWidths=[90, 200, 75, 110, 65])
                t.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3730A3")),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, -1), 9),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                            ("TOPPADDING", (0, 0), (-1, -1), 5),
                            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ]
                    )
                )
                elements.append(t)
                elements.append(Spacer(1, 10))

            doc.build(elements)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return pdf_bytes
        except Exception:
            return _generate_fallback_pdf(itinerary)

    @staticmethod
    def generate_ics(itinerary: Itinerary) -> bytes:
        try:
            from icalendar import Calendar, Event

            cal = Calendar()
            cal.add("prodid", "-//AI Travel Planner//SDLC Assistant//EN")
            cal.add("version", "2.0")
            cal.add("x-wr-calname", f"Trip to {itinerary.destination}")

            start_date = date.today() + timedelta(days=14)

            for day in itinerary.days:
                day_offset = day.day_number - 1
                trip_day_date = start_date + timedelta(days=day_offset)

                for act in day.activities:
                    event = Event()
                    event.add("summary", f"{act.title} ({act.category})")
                    event.add(
                        "description",
                        f"{act.description or ''}\nEstimated Cost: {itinerary.currency} {act.estimated_cost}\nLocation: {act.location}",
                    )
                    event.add("location", act.location or itinerary.destination)
                    event.add("uid", f"{act.id or uuid.uuid4()}@wanderai.local")

                    start_dt = datetime.combine(
                        trip_day_date,
                        time(9 + ((act.sequence_order or 0) * 3), 0),
                        tzinfo=timezone.utc,
                    )
                    duration = timedelta(minutes=act.duration_minutes or 60)
                    end_dt = start_dt + duration

                    event.add("dtstart", start_dt)
                    event.add("dtend", end_dt)
                    event.add("dtstamp", datetime.now(timezone.utc))

                    cal.add_component(event)

            return cal.to_ical()
        except Exception:
            return _generate_rfc5545_ics(itinerary)

    @staticmethod
    def generate_share_token(itinerary: Itinerary, db: Session) -> str:
        if not itinerary.share_token:
            itinerary.share_token = secrets.token_urlsafe(16)
            db.add(itinerary)
            db.commit()
            db.refresh(itinerary)
        return itinerary.share_token
