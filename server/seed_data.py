from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from server.auth import hash_password
from server.models import User, UserAddress, Watch


def seed_data(db: Session) -> None:
    """Seed initial demo users, addresses, and luxury watches idempotently."""

    # 1. Seed Customer User
    customer_user = db.query(User).filter(User.email == "test@example.com").first()
    if not customer_user:
        customer_user = User(
            email="test@example.com",
            hashed_password=hash_password("testpassword"),
            full_name="Alex Mercer",
            role="customer",
            is_active=True,
        )
        db.add(customer_user)
        try:
            db.commit()
            db.refresh(customer_user)
        except IntegrityError:
            db.rollback()
            customer_user = (
                db.query(User).filter(User.email == "test@example.com").first()
            )

    # 2. Seed Admin User
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@example.com",
            hashed_password=hash_password("adminpassword"),
            full_name="Master Horologist Admin",
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        try:
            db.commit()
            db.refresh(admin_user)
        except IntegrityError:
            db.rollback()
            admin_user = (
                db.query(User).filter(User.email == "admin@example.com").first()
            )

    # 3. Seed Default Address for Customer
    if customer_user:
        address = (
            db.query(UserAddress)
            .filter(UserAddress.user_id == customer_user.id)
            .first()
        )
        if not address:
            address = UserAddress(
                user_id=customer_user.id,
                street_address="450 Park Avenue, Suite 2800",
                city="New York",
                state="NY",
                postal_code="10022",
                country="United States",
                is_default=True,
            )
            db.add(address)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    # 4. Seed Timepiece Inventory
    sample_watches = [
        {
            "brand": "Rolex",
            "model": "Submariner Date 41mm",
            "reference_number": "126610LN",
            "serial_number": "884J921X",
            "year_of_manufacture": 2022,
            "condition_score": 9.8,
            "condition_grade": "Mint",
            "price": 14850.0,
            "movement_type": "Automatic",
            "case_size_mm": 41.0,
            "dial_color": "Black",
            "bezel_material": "Cerachrom Ceramic",
            "strap_material": "Oystersteel",
            "box_included": True,
            "papers_included": True,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-99281",
            "authenticator_notes": "Flawless dial and sapphire crystal. Factory chamfers intact on lugs. Calibre 3235 timed at +1.2s/day with 305° amplitude.",
            "image_urls": [
                "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1547996160-71dfabb19286?auto=format&fit=crop&w=1200&q=80",
            ],
            "status": "AVAILABLE",
        },
        {
            "brand": "Omega",
            "model": "Speedmaster Professional Moonwatch",
            "reference_number": "310.30.42.50.01.002",
            "serial_number": "789A123Y",
            "year_of_manufacture": 2021,
            "condition_score": 9.5,
            "condition_grade": "Mint",
            "price": 7200.0,
            "movement_type": "Manual",
            "case_size_mm": 42.0,
            "dial_color": "Black Step Dial",
            "bezel_material": "Anodized Aluminum",
            "strap_material": "Stainless Steel",
            "box_included": True,
            "papers_included": True,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-44019",
            "authenticator_notes": "Sapphire sandwich edition displaying Master Chronometer Calibre 3861. METAS precision certificate included.",
            "image_urls": [
                "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80"
            ],
            "status": "AVAILABLE",
        },
        {
            "brand": "Patek Philippe",
            "model": "Aquanaut 5167A",
            "reference_number": "5167A-001",
            "serial_number": "554P881K",
            "year_of_manufacture": 2020,
            "condition_score": 9.7,
            "condition_grade": "Mint",
            "price": 52000.0,
            "movement_type": "Automatic",
            "case_size_mm": 40.8,
            "dial_color": "Embossed Black",
            "bezel_material": "Stainless Steel",
            "strap_material": "Composite Tropical",
            "box_included": True,
            "papers_included": True,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-81203",
            "authenticator_notes": "Calibre 324 S C with 21k gold rotor. Original certificate of origin and presentation box present.",
            "image_urls": [
                "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=80"
            ],
            "status": "AVAILABLE",
        },
        {
            "brand": "Audemars Piguet",
            "model": "Royal Oak Selfwinding",
            "reference_number": "15500ST.OO.1220ST.01",
            "serial_number": "991K442Z",
            "year_of_manufacture": 2023,
            "condition_score": 9.9,
            "condition_grade": "Mint",
            "price": 38500.0,
            "movement_type": "Automatic",
            "case_size_mm": 41.0,
            "dial_color": "Blue Grande Tapisserie",
            "bezel_material": "Stainless Steel with White Gold Screws",
            "strap_material": "Integrated Stainless Steel",
            "box_included": True,
            "papers_included": True,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-66190",
            "authenticator_notes": "Atelier inspected: zero hairline scratches on satin-brushed bezel. Full manufacturer warranty active.",
            "image_urls": [
                "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&q=80"
            ],
            "status": "AVAILABLE",
        },
        {
            "brand": "Cartier",
            "model": "Santos de Cartier Large",
            "reference_number": "WSSA0018",
            "serial_number": "331C802M",
            "year_of_manufacture": 2022,
            "condition_score": 9.2,
            "condition_grade": "Near Mint",
            "price": 6900.0,
            "movement_type": "Automatic",
            "case_size_mm": 39.8,
            "dial_color": "Silvered Opaline",
            "bezel_material": "Polished Steel",
            "strap_material": "SmartLink Steel & QuickSwitch Calfskin",
            "box_included": True,
            "papers_included": True,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-22910",
            "authenticator_notes": "Calibre 1847 MC movement in excellent health. Includes both stainless steel bracelet and calfskin strap.",
            "image_urls": [
                "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80"
            ],
            "status": "AVAILABLE",
        },
        {
            "brand": "Breitling",
            "model": "Navitimer B01 Chronograph 43",
            "reference_number": "AB0138241G1P1",
            "serial_number": "112B903Q",
            "year_of_manufacture": 2022,
            "condition_score": 9.4,
            "condition_grade": "Mint",
            "price": 6100.0,
            "movement_type": "Automatic",
            "case_size_mm": 43.0,
            "dial_color": "Silver & Ice Blue",
            "bezel_material": "Bidirectional Slide Rule",
            "strap_material": "Black Alligator Leather",
            "box_included": True,
            "papers_included": False,
            "authentication_status": "VERIFIED",
            "certificate_number": "CERT-39912",
            "authenticator_notes": "Manufacture Calibre 01 with 70-hour power reserve. Certified chronometer with Breitling digital warranty.",
            "image_urls": [
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80"
            ],
            "status": "AVAILABLE",
        },
    ]

    for data in sample_watches:
        existing = (
            db.query(Watch).filter(Watch.serial_number == data["serial_number"]).first()
        )
        if not existing:
            img_urls = data.pop("image_urls")
            watch = Watch(**data)
            watch.image_urls = img_urls
            db.add(watch)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
