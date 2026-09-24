from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.models import EnvironmentalReading, Location
from server.schemas import EnvironmentalReadingCreate


class EnvironmentalService:
    @staticmethod
    def get_readings(
        db: Session,
        location_id: Optional[str] = None,
        is_breach: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[EnvironmentalReading]:
        query = db.query(EnvironmentalReading).order_by(EnvironmentalReading.reading_timestamp.desc())
        if location_id:
            query = query.filter(EnvironmentalReading.location_id == location_id)
        if is_breach is not None:
            query = query.filter(EnvironmentalReading.is_breach == is_breach)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def ingest_reading(db: Session, reading_in: EnvironmentalReadingCreate) -> EnvironmentalReading:
        location = db.query(Location).filter(Location.id == reading_in.location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Location with ID '{reading_in.location_id}' not found."
            )

        # Evaluate threshold breaches
        temp = reading_in.temperature_celsius
        hum = reading_in.humidity_percentage
        breaches = []

        if temp < location.temp_min_celsius:
            breaches.append(f"Temperature {temp:.1f}°C below min {location.temp_min_celsius:.1f}°C")
        elif temp > location.temp_max_celsius:
            breaches.append(f"Temperature {temp:.1f}°C exceeds max {location.temp_max_celsius:.1f}°C")

        if hum < location.humidity_min_percent:
            breaches.append(f"Humidity {hum:.1f}% below min {location.humidity_min_percent:.1f}%")
        elif hum > location.humidity_max_percent:
            breaches.append(f"Humidity {hum:.1f}% exceeds max {location.humidity_max_percent:.1f}%")

        is_breach = len(breaches) > 0
        breach_details = "; ".join(breaches) if is_breach else None

        reading_dict = reading_in.model_dump()
        if not reading_dict.get("reading_timestamp"):
            reading_dict["reading_timestamp"] = datetime.utcnow()

        reading = EnvironmentalReading(
            location_id=reading_in.location_id,
            temperature_celsius=reading_in.temperature_celsius,
            humidity_percentage=reading_in.humidity_percentage,
            is_breach=is_breach,
            breach_details=breach_details,
            reading_timestamp=reading_dict["reading_timestamp"]
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return reading

    @staticmethod
    def get_sensor_summary(db: Session) -> Dict[str, Any]:
        locations = db.query(Location).all()
        now = datetime.utcnow()
        threshold_time = now - timedelta(minutes=15)

        total_sensors = len(locations)
        online_sensors = 0
        offline_sensors = []
        active_breaches = []

        for loc in locations:
            latest_reading = db.query(EnvironmentalReading).filter(
                EnvironmentalReading.location_id == loc.id
            ).order_by(EnvironmentalReading.reading_timestamp.desc()).first()

            if latest_reading and latest_reading.reading_timestamp >= threshold_time:
                online_sensors += 1
                if latest_reading.is_breach:
                    active_breaches.append({
                        "location_id": loc.id,
                        "location_name": loc.name,
                        "temperature_celsius": latest_reading.temperature_celsius,
                        "humidity_percentage": latest_reading.humidity_percentage,
                        "breach_details": latest_reading.breach_details,
                        "timestamp": latest_reading.reading_timestamp.isoformat()
                    })
            else:
                last_seen = latest_reading.reading_timestamp.isoformat() if latest_reading else None
                offline_sensors.append({
                    "location_id": loc.id,
                    "location_name": loc.name,
                    "last_seen": last_seen,
                    "status": "Offline (No telemetry for >15 minutes)"
                })

        return {
            "total_sensors": total_sensors,
            "online_sensors": online_sensors,
            "offline_sensors_count": len(offline_sensors),
            "offline_sensors": offline_sensors,
            "active_breaches_count": len(active_breaches),
            "active_breaches": active_breaches
        }
