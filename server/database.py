from datetime import datetime
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from server.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(bind_engine=None) -> None:
    target_engine = bind_engine or engine
    Base.metadata.create_all(bind=target_engine)


def seed_data(db: Session) -> None:
    from server.models import ClusterKPI, Scenario, SKU

    # 1. Seed Cluster KPIs
    cluster_kpi = db.query(ClusterKPI).filter(ClusterKPI.cluster_name == "Small Town Value Cluster").first()
    if not cluster_kpi:
        cluster_kpi = ClusterKPI(
            cluster_name="Small Town Value Cluster",
            sales_per_linear_ft=145.50,
            private_brand_share_pct=28.5,
            in_stock_rate_pct=96.2,
            shelf_capacity_utilization_pct=92.0,
            updated_at=datetime.utcnow()
        )
        db.add(cluster_kpi)

    # 2. Seed Scenarios
    scenarios_data = [
        {
            "code": "CONSERVATIVE",
            "title": "Conservative",
            "description": "Low risk, minor SKU adjustments focused on risk mitigation.",
            "projected_sales_growth_pct": 1.8,
            "projected_private_brand_share_pct": 26.0,
            "shelf_space_impact_pct": 1.2,
            "sku_actions_summary": {"grow": 2, "maintain": 15, "swap": 1, "reduce": 1},
            "is_default": False
        },
        {
            "code": "BALANCED",
            "title": "Balanced",
            "description": "Optimal balance of margin improvement and private brand expansion.",
            "projected_sales_growth_pct": 4.2,
            "projected_private_brand_share_pct": 29.5,
            "shelf_space_impact_pct": 3.5,
            "sku_actions_summary": {"grow": 4, "maintain": 12, "swap": 3, "reduce": 2},
            "is_default": True
        },
        {
            "code": "AGGRESSIVE",
            "title": "Aggressive",
            "description": "Maximum sales yield push and private brand acceleration.",
            "projected_sales_growth_pct": 8.5,
            "projected_private_brand_share_pct": 32.0,
            "shelf_space_impact_pct": 6.8,
            "sku_actions_summary": {"grow": 7, "maintain": 8, "swap": 5, "reduce": 4},
            "is_default": False
        }
    ]

    for s_data in scenarios_data:
        existing = db.query(Scenario).filter(Scenario.code == s_data["code"]).first()
        if not existing:
            db.add(Scenario(**s_data))

    # 3. Seed 21 Snacks SKUs
    skus_data = [
        # 4 GROW SKUs
        {
            "sku_code": "SNK-10042",
            "name": "DG Brand Potato Chips 10oz",
            "category": "Snacks",
            "weekly_unit_sales": 340,
            "sales_per_linear_ft": 185.00,
            "margin_pct": 32.5,
            "space_allocation_ft": 2.5,
            "is_private_brand": True,
            "status_badge": "GROW"
        },
        {
            "sku_code": "SNK-10043",
            "name": "Clover Valley Tortilla Chips 12oz",
            "category": "Snacks",
            "weekly_unit_sales": 310,
            "sales_per_linear_ft": 172.00,
            "margin_pct": 34.0,
            "space_allocation_ft": 2.5,
            "is_private_brand": True,
            "status_badge": "GROW"
        },
        {
            "sku_code": "SNK-10044",
            "name": "Clover Valley Kettle Cooked Sea Salt 8oz",
            "category": "Snacks",
            "weekly_unit_sales": 280,
            "sales_per_linear_ft": 165.50,
            "margin_pct": 33.0,
            "space_allocation_ft": 2.0,
            "is_private_brand": True,
            "status_badge": "GROW"
        },
        {
            "sku_code": "SNK-10045",
            "name": "Clover Valley Roasted Cashews 6oz",
            "category": "Snacks",
            "weekly_unit_sales": 240,
            "sales_per_linear_ft": 190.00,
            "margin_pct": 36.0,
            "space_allocation_ft": 1.5,
            "is_private_brand": True,
            "status_badge": "GROW"
        },
        # 12 MAINTAIN SKUs
        {
            "sku_code": "SNK-10115",
            "name": "DG Brand Trail Mix 6oz",
            "category": "Snacks",
            "weekly_unit_sales": 290,
            "sales_per_linear_ft": 142.00,
            "margin_pct": 30.0,
            "space_allocation_ft": 2.0,
            "is_private_brand": True,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10116",
            "name": "National Brand Classic Corn Chips 9.5oz",
            "category": "Snacks",
            "weekly_unit_sales": 260,
            "sales_per_linear_ft": 140.00,
            "margin_pct": 24.5,
            "space_allocation_ft": 2.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10117",
            "name": "National Brand Barbecue Potato Chips 8oz",
            "category": "Snacks",
            "weekly_unit_sales": 250,
            "sales_per_linear_ft": 138.00,
            "margin_pct": 23.0,
            "space_allocation_ft": 2.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10118",
            "name": "Clover Valley Salted Peanuts 16oz",
            "category": "Snacks",
            "weekly_unit_sales": 230,
            "sales_per_linear_ft": 135.00,
            "margin_pct": 28.5,
            "space_allocation_ft": 1.5,
            "is_private_brand": True,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10119",
            "name": "National Brand Sour Cream & Onion 7.5oz",
            "category": "Snacks",
            "weekly_unit_sales": 210,
            "sales_per_linear_ft": 132.00,
            "margin_pct": 22.0,
            "space_allocation_ft": 1.5,
            "is_private_brand": False,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10120",
            "name": "Clover Valley Cheese Balls Tub 14oz",
            "category": "Snacks",
            "weekly_unit_sales": 200,
            "sales_per_linear_ft": 130.00,
            "margin_pct": 29.0,
            "space_allocation_ft": 2.0,
            "is_private_brand": True,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10121",
            "name": "National Brand Gummy Bears 5oz",
            "category": "Snacks",
            "weekly_unit_sales": 195,
            "sales_per_linear_ft": 128.00,
            "margin_pct": 25.0,
            "space_allocation_ft": 1.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10122",
            "name": "Clover Valley Butter Popcorn 3-pk",
            "category": "Snacks",
            "weekly_unit_sales": 185,
            "sales_per_linear_ft": 125.00,
            "margin_pct": 31.0,
            "space_allocation_ft": 1.5,
            "is_private_brand": True,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10123",
            "name": "National Brand Beef Jerky Teriyaki 3.25oz",
            "category": "Snacks",
            "weekly_unit_sales": 160,
            "sales_per_linear_ft": 150.00,
            "margin_pct": 21.0,
            "space_allocation_ft": 1.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10124",
            "name": "Clover Valley Honey Wheat Braided Pretzels 10oz",
            "category": "Snacks",
            "weekly_unit_sales": 170,
            "sales_per_linear_ft": 120.00,
            "margin_pct": 28.0,
            "space_allocation_ft": 1.5,
            "is_private_brand": True,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10125",
            "name": "National Brand Microwave Cheddar Popcorn 3-pk",
            "category": "Snacks",
            "weekly_unit_sales": 155,
            "sales_per_linear_ft": 118.00,
            "margin_pct": 20.5,
            "space_allocation_ft": 1.5,
            "is_private_brand": False,
            "status_badge": "MAINTAIN"
        },
        {
            "sku_code": "SNK-10126",
            "name": "Clover Valley Sunflower Seeds 6oz",
            "category": "Snacks",
            "weekly_unit_sales": 140,
            "sales_per_linear_ft": 110.00,
            "margin_pct": 27.5,
            "space_allocation_ft": 1.0,
            "is_private_brand": True,
            "status_badge": "MAINTAIN"
        },
        # 3 SWAP SKUs
        {
            "sku_code": "SNK-10891",
            "name": "Name Brand Pretzels 8oz",
            "category": "Snacks",
            "weekly_unit_sales": 85,
            "sales_per_linear_ft": 62.10,
            "margin_pct": 18.0,
            "space_allocation_ft": 1.5,
            "is_private_brand": False,
            "status_badge": "SWAP"
        },
        {
            "sku_code": "SNK-10892",
            "name": "Slow-Moving Brand Pita Chips 6oz",
            "category": "Snacks",
            "weekly_unit_sales": 70,
            "sales_per_linear_ft": 58.00,
            "margin_pct": 16.5,
            "space_allocation_ft": 1.5,
            "is_private_brand": False,
            "status_badge": "SWAP"
        },
        {
            "sku_code": "SNK-10893",
            "name": "Legacy Brand Veggie Straws 5oz",
            "category": "Snacks",
            "weekly_unit_sales": 65,
            "sales_per_linear_ft": 54.00,
            "margin_pct": 17.0,
            "space_allocation_ft": 1.5,
            "is_private_brand": False,
            "status_badge": "SWAP"
        },
        # 2 REDUCE SKUs
        {
            "sku_code": "SNK-10422",
            "name": "Name Brand Cheese Curls 7oz",
            "category": "Snacks",
            "weekly_unit_sales": 50,
            "sales_per_linear_ft": 45.00,
            "margin_pct": 15.0,
            "space_allocation_ft": 1.0,
            "is_private_brand": False,
            "status_badge": "REDUCE"
        },
        {
            "sku_code": "SNK-10423",
            "name": "Off-Brand Rice Crisps 4oz",
            "category": "Snacks",
            "weekly_unit_sales": 35,
            "sales_per_linear_ft": 38.00,
            "margin_pct": 14.0,
            "space_allocation_ft": 1.0,
            "is_private_brand": False,
            "status_badge": "REDUCE"
        }
    ]

    for sku in skus_data:
        existing = db.query(SKU).filter(SKU.sku_code == sku["sku_code"]).first()
        if not existing:
            db.add(SKU(**sku))

    try:
        db.commit()
    except Exception:
        db.rollback()
