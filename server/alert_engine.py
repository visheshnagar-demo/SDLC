import uuid
from datetime import datetime, timezone
from typing import Dict, Tuple, List
from sqlalchemy.orm import Session
from server import models

DEFAULT_THRESHOLDS = {
    "ph_level": (6.5, 7.8),
    "dissolved_oxygen": (5.0, 12.0),
    "temperature_c": (22.0, 28.0),
    "ammonia_ppm": (0.0, 0.05),
}


def is_critical_breach(param: str, value: float, min_t: float, max_t: float) -> bool:
    if param == "ph_level":
        return value < (min_t - 0.5) or value > (max_t + 0.5)
    elif param == "dissolved_oxygen":
        return value < (min_t - 1.5)
    elif param == "temperature_c":
        return value < (min_t - 3.0) or value > (max_t + 3.0)
    elif param == "ammonia_ppm":
        return value > (max_t * 2.0)
    return False


def compute_param_status(param: str, value: float, min_t: float, max_t: float) -> str:
    if min_t <= value <= max_t:
        return "SAFE"
    if is_critical_breach(param, value, min_t, max_t):
        return "CRITICAL"
    return "WARNING"


def evaluate_telemetry(db: Session, reading: models.TelemetryReading) -> List[models.Alert]:
    """
    Evaluates telemetry reading against configured thresholds for the tank.
    Generates Alert records if parameters breach safe bounds and deduplicates against active alerts.
    """
    threshold_records = (
        db.query(models.AlertThreshold)
        .filter(
            models.AlertThreshold.tank_id == reading.tank_id,
            models.AlertThreshold.is_active == True,
        )
        .all()
    )

    threshold_map: Dict[str, Tuple[float, float]] = {}
    for t in threshold_records:
        threshold_map[t.parameter_name] = (t.min_threshold, t.max_threshold)

    metrics = {
        "ph_level": reading.ph_level,
        "dissolved_oxygen": reading.dissolved_oxygen,
        "temperature_c": reading.temperature_c,
        "ammonia_ppm": reading.ammonia_ppm,
    }

    generated_alerts = []
    now = datetime.now(timezone.utc)

    for param, val in metrics.items():
        min_val, max_val = threshold_map.get(param, DEFAULT_THRESHOLDS.get(param, (0.0, 100.0)))
        if val < min_val or val > max_val:
            violation = "MIN" if val < min_val else "MAX"
            severity = "CRITICAL" if is_critical_breach(param, val, min_val, max_val) else "WARNING"
            
            # Check for existing active alert to deduplicate
            existing_active = (
                db.query(models.Alert)
                .filter(
                    models.Alert.tank_id == reading.tank_id,
                    models.Alert.parameter_name == param,
                    models.Alert.status == "ACTIVE",
                )
                .first()
            )

            if not existing_active:
                alert = models.Alert(
                    id=str(uuid.uuid4()),
                    tank_id=reading.tank_id,
                    parameter_name=param,
                    recorded_value=val,
                    threshold_violated=violation,
                    severity=severity,
                    status="ACTIVE",
                    message=f"{param} breached {violation} threshold ({val} outside [{min_val}, {max_val}])",
                    triggered_at=reading.recorded_at or now,
                    created_at=now,
                    updated_at=now,
                )
                db.add(alert)
                generated_alerts.append(alert)

    if generated_alerts:
        db.commit()
        for alert in generated_alerts:
            db.refresh(alert)

    return generated_alerts


def get_latest_telemetry_status(
    db: Session, tank_id: str, reading: models.TelemetryReading
) -> Dict[str, str]:
    """Calculates status indicators for the latest reading against thresholds."""
    threshold_records = (
        db.query(models.AlertThreshold)
        .filter(
            models.AlertThreshold.tank_id == tank_id,
            models.AlertThreshold.is_active == True,
        )
        .all()
    )

    threshold_map: Dict[str, Tuple[float, float]] = {}
    for t in threshold_records:
        threshold_map[t.parameter_name] = (t.min_threshold, t.max_threshold)

    return {
        "ph_status": compute_param_status(
            "ph_level",
            reading.ph_level,
            *threshold_map.get("ph_level", DEFAULT_THRESHOLDS["ph_level"]),
        ),
        "oxygen_status": compute_param_status(
            "dissolved_oxygen",
            reading.dissolved_oxygen,
            *threshold_map.get("dissolved_oxygen", DEFAULT_THRESHOLDS["dissolved_oxygen"]),
        ),
        "temperature_status": compute_param_status(
            "temperature_c",
            reading.temperature_c,
            *threshold_map.get("temperature_c", DEFAULT_THRESHOLDS["temperature_c"]),
        ),
        "ammonia_status": compute_param_status(
            "ammonia_ppm",
            reading.ammonia_ppm,
            *threshold_map.get("ammonia_ppm", DEFAULT_THRESHOLDS["ammonia_ppm"]),
        ),
    }
