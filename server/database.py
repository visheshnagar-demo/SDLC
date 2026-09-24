import os
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from server.models import (
    Base,
    Location,
    Artifact,
    RestorationRecord,
    EnvironmentalReading,
    Inspection,
    MuseumLoan
)
from server.config import DATABASE_URL, TESTING

connect_args = {}
poolclass = None

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL or TESTING:
        poolclass = StaticPool

engine_kwargs = {"connect_args": connect_args}
if poolclass:
    engine_kwargs["poolclass"] = poolclass

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    # Check if locations exist
    loc_count = db.query(Location).count()
    if loc_count > 0:
        return

    # Seed Locations
    loc1 = Location(
        id="9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        name="Gallery 3 - Case B",
        zone_type="Display Case",
        temp_min_celsius=18.0,
        temp_max_celsius=22.0,
        humidity_min_percent=45.0,
        humidity_max_percent=55.0
    )
    loc2 = Location(
        id="c2a5e4d1-8173-4f56-913a-34567890abcd",
        name="Gallery 1 (Classical Antiquities)",
        zone_type="Gallery",
        temp_min_celsius=18.0,
        temp_max_celsius=22.0,
        humidity_min_percent=45.0,
        humidity_max_percent=55.0
    )
    loc3 = Location(
        id="e7b8c9d0-1234-5678-9abc-def012345678",
        name="Storage Vault A (Textiles)",
        zone_type="Storage Vault",
        temp_min_celsius=16.0,
        temp_max_celsius=19.0,
        humidity_min_percent=40.0,
        humidity_max_percent=50.0
    )
    loc4 = Location(
        id="f1e2d3c4-b5a6-7890-1234-567890abcdef",
        name="Restoration Lab",
        zone_type="Restoration Lab",
        temp_min_celsius=19.0,
        temp_max_celsius=23.0,
        humidity_min_percent=45.0,
        humidity_max_percent=55.0
    )
    db.add_all([loc1, loc2, loc3, loc4])
    db.commit()

    # Seed Artifacts
    art1 = Artifact(
        id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
        accession_no="ART-2026-001",
        title="Roman Terracotta Amphora",
        description="Intact dual-handled storage vessel from Mediterranean trade route.",
        category="Ceramic",
        medium="Terracotta",
        creation_era="1st Century CE",
        origin="Pompeii, Italy",
        accession_date=date(2026, 1, 15),
        current_location_id=loc1.id,
        status="On Display",
        condition_rating="Stable",
        image_url="https://images.museum.org/artifacts/art-2026-001.jpg"
    )
    art2 = Artifact(
        id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        accession_no="ART-2026-089",
        title="Flemish Silk Tapestry Fragment",
        description="Late medieval silk and wool wall hanging depiction.",
        category="Textile",
        medium="Silk & Wool",
        creation_era="15th Century",
        origin="Flanders, Belgium",
        accession_date=date(2026, 2, 10),
        current_location_id=loc3.id,
        status="In Storage",
        condition_rating="Fair",
        image_url="https://images.museum.org/artifacts/art-2026-089.jpg"
    )
    art3 = Artifact(
        id="d4e5f6a7-b8c9-0123-4567-89abcdef0123",
        accession_no="ART-2026-085",
        title="Bronze Statue of Hermes",
        description="Cast bronze statuette showing messenger deity with winged sandals.",
        category="Sculpture",
        medium="Bronze",
        creation_era="4th Century BCE",
        origin="Athens, Greece",
        accession_date=date(2026, 3, 1),
        current_location_id=loc2.id,
        status="On Loan",
        condition_rating="Good",
        image_url="https://images.museum.org/artifacts/art-2026-085.jpg"
    )
    db.add_all([art1, art2, art3])
    db.commit()

    # Seed Restoration
    rest1 = RestorationRecord(
        id="9042b8b7-8f03-4dc0-ac2d-5fac0d960c6a",
        artifact_id=art1.id,
        conservator_name="Dr. Eleanor Vance",
        treatment_date=date(2026, 9, 24),
        technique="Structural Stabilization & Desalination",
        materials_used="Micro-crystalline wax, Paraloid B-72, deionized water baths",
        assessment_notes="Surface salt efflorescence neutralized; fracture hairline reinforced.",
        condition_before="Fair",
        condition_after="Stable"
    )
    db.add(rest1)

    # Seed Readings
    now = datetime.utcnow()
    read1 = EnvironmentalReading(
        id="r1a2b3c4-d5e6-7890-abcd-ef0123456789",
        location_id=loc2.id,
        temperature_celsius=20.5,
        humidity_percentage=48.0,
        is_breach=False,
        breach_details=None,
        reading_timestamp=now - timedelta(minutes=5)
    )
    read2 = EnvironmentalReading(
        id="r2a2b3c4-d5e6-7890-abcd-ef0123456789",
        location_id=loc3.id,
        temperature_celsius=24.5,
        humidity_percentage=68.2,
        is_breach=True,
        breach_details="Temperature 24.5°C exceeds max 19.0°C; Humidity 68.2% exceeds max 50.0%",
        reading_timestamp=now - timedelta(minutes=2)
    )
    db.add_all([read1, read2])

    # Seed Inspection
    insp1 = Inspection(
        id="i1a2b3c4-d5e6-7890-abcd-ef0123456789",
        artifact_id=art2.id,
        assigned_inspector="Dr. Eleanor Vance",
        scheduled_date=date.today() - timedelta(days=4),
        completed_date=None,
        inspection_status="Overdue",
        surface_condition="Minor Wear",
        pest_activity=False,
        structural_integrity="Fragile",
        findings_notes="Inspection pending - high risk due to recent Vault A moisture excursion.",
        next_recommended_inspection_date=None
    )
    db.add(insp1)

    # Seed Loan
    loan1 = MuseumLoan(
        id="l1a2b3c4-d5e6-7890-abcd-ef0123456789",
        artifact_id=art3.id,
        partner_museum_name="Metropolitan Art Institute",
        contact_person="Julian Thorne",
        contact_email="jthorne@metart.org",
        loan_start_date=date(2026, 6, 1),
        loan_end_date=date(2026, 12, 1),
        indemnity_valuation=500000.00,
        transit_requirements="Climate-controlled courier vehicle, dual shock mounts.",
        loan_status="In Transit",
        return_inspection_notes=None
    )
    db.add(loan1)

    db.commit()
