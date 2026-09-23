import secrets
from datetime import datetime, date, timedelta
from server.models import Itinerary


class ExportService:
    @staticmethod
    def generate_share_token() -> str:
        """Generate a cryptographically secure random token."""
        return f"tok_{secrets.token_hex(16)}"

    @staticmethod
    def export_pdf(itinerary: Itinerary) -> bytes:
        """
        Generate a valid PDF document (PDF-1.4 format) representing the itinerary.
        """
        lines = [
            f"AI Travel Itinerary: {itinerary.destination}",
            f"Duration: {itinerary.duration_days} Days | Budget: {itinerary.budget:,.2f} {itinerary.currency} | Total Cost: {itinerary.total_estimated_cost:,.2f} {itinerary.currency}",
            f"Status: {itinerary.budget_status} | Interests: {', '.join(itinerary.interests) if itinerary.interests else 'General'}",
            "",
            "=" * 60,
        ]

        for day in itinerary.days:
            date_info = f" ({day.date})" if day.date else ""
            lines.append(
                f"Day {day.day_number}{date_info} — Daily Cost: {day.daily_estimated_cost:,.2f} {itinerary.currency}"
            )
            for act in day.activities:
                lines.append(
                    f"  [{act.time_slot}] {act.title} — {act.estimated_cost:,.2f} {itinerary.currency} ({act.category})"
                )
                if act.description:
                    lines.append(f"    Details: {act.description}")
                if act.location:
                    lines.append(
                        f"    Location: {act.location} ({act.duration_minutes} mins)"
                    )
            lines.append("-" * 40)

        text_content = "\n".join(lines)
        pdf_text_escaped = (
            text_content.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        )
        pdf_lines = pdf_text_escaped.split("\n")

        stream_ops = ["BT", "/F1 10 Tf", "50 750 Td", "14 TL"]
        for line in pdf_lines[:60]:
            stream_ops.append(f"({line[:80]}) '")
        stream_ops.append("ET")
        stream_str = "\n".join(stream_ops)

        pdf_body = (
            f"%PDF-1.4\n"
            f"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            f"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            f"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
            f"4 0 obj\n<< /Length {len(stream_str.encode('utf-8'))} >>\nstream\n{stream_str}\nendstream\nendobj\n"
            f"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
            f"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n"
            f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n435\n%%EOF\n"
        )
        return pdf_body.encode("utf-8")

    @staticmethod
    def export_ics(itinerary: Itinerary) -> bytes:
        """
        Generate an iCalendar (.ics) format file following RFC 5545 specification.
        """
        base_date = date.today() + timedelta(days=14)
        time_offsets = {
            "Morning": (9, 0),
            "Lunch": (12, 30),
            "Afternoon": (14, 0),
            "Evening": (18, 30),
        }

        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//AI Travel Planner//EN",
            f"X-WR-CALNAME:Trip to {itinerary.destination}",
            "CALSCALE:GREGORIAN",
        ]

        for day in itinerary.days:
            day_offset = day.day_number - 1
            current_date = base_date + timedelta(days=day_offset)

            for act in day.activities:
                hour, minute = time_offsets.get(act.time_slot, (10, 0))
                start_dt = datetime.combine(current_date, datetime.min.time()).replace(
                    hour=hour, minute=minute
                )
                end_dt = start_dt + timedelta(minutes=act.duration_minutes or 60)

                dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
                dtstart = start_dt.strftime("%Y%m%dT%H%M%SZ")
                dtend = end_dt.strftime("%Y%m%dT%H%M%SZ")

                summary = f"{act.title} ({act.category})"
                description = (
                    f"{act.description or ''}\\n\\n"
                    f"Estimated Cost: {act.estimated_cost} {itinerary.currency}\\n"
                    f"Time Slot: {act.time_slot}"
                ).replace("\n", "\\n")

                ics_lines.extend(
                    [
                        "BEGIN:VEVENT",
                        f"UID:{act.id}@aitravelplanner",
                        f"DTSTAMP:{dtstamp}",
                        f"DTSTART:{dtstart}",
                        f"DTEND:{dtend}",
                        f"SUMMARY:{summary}",
                        f"DESCRIPTION:{description}",
                    ]
                )

                if act.location:
                    ics_lines.append(f"LOCATION:{act.location}")

                ics_lines.append("END:VEVENT")

        ics_lines.append("END:VCALENDAR")
        return "\r\n".join(ics_lines).encode("utf-8")
