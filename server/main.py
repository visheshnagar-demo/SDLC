import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from server.database import init_db, SessionLocal, seed_data
from server.routes.itineraries import router as itineraries_router
from server.routes.activities import router as activities_router
from server.routes.export import router as export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema and seed data
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AI Travel Planner API",
    description="Customizable AI-Powered Itinerary Generation and Travel Budget Management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(itineraries_router)
app.include_router(activities_router)
app.include_router(export_router)


@app.get("/")
def root():
    return {"message": "AI Travel Planner API is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
