"""Business logic service for Study Plans, Sessions, and Recommendations."""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from server.models.subject import Subject
from server.models.availability import AvailabilityProfile
from server.models.study_plan import StudyPlan
from server.models.study_session import StudySession
from server.models.recommendation import PriorityRecommendation
from server.schemas.schedule import ScheduleGenerateRequest
from server.services.ai_engine import AISchedulingEngine


class ScheduleService:
    @staticmethod
    def get_all_schedules(
        db: Session, skip: int = 0, limit: int = 100
    ) -> List[StudyPlan]:
        return db.query(StudyPlan).offset(skip).limit(limit).all()

    @staticmethod
    def get_schedule_by_id(db: Session, plan_id: str) -> Optional[StudyPlan]:
        return db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()

    @classmethod
    def generate_and_save_schedule(
        cls, db: Session, req: ScheduleGenerateRequest
    ) -> StudyPlan:
        # 1. Fetch requested subjects
        subjects = db.query(Subject).filter(Subject.id.in_(req.subject_ids)).all()
        if not subjects:
            raise ValueError("No valid subjects found for the provided subject_ids.")

        # 2. Fetch weekly availability profile
        avail_profiles = db.query(AvailabilityProfile).all()
        availability_map: Dict[str, tuple] = {}
        for ap in avail_profiles:
            availability_map[str(ap.day_of_week).upper()] = (
                int(ap.available_minutes),
                str(ap.preferred_time_of_day),
            )

        # 3. Execute AI scheduling engine
        sessions_data, total_hours = AISchedulingEngine.generate_schedule(
            subjects=subjects,
            availability_map=availability_map,
            start_date=req.start_date,
            end_date=req.end_date,
            daily_max_minutes=req.daily_max_minutes,
        )

        now = datetime.now(timezone.utc)
        plan_id = str(uuid.uuid4())
        study_plan = StudyPlan(
            id=plan_id,
            title=req.plan_title,
            start_date=req.start_date,
            end_date=req.end_date,
            total_study_hours=total_hours,
            status="ACTIVE",
            created_at=now,
            updated_at=now,
        )
        db.add(study_plan)
        db.flush()

        # 4. Save sessions
        session_entities = []
        for s in sessions_data:
            sess = StudySession(
                id=str(uuid.uuid4()),
                study_plan_id=plan_id,
                subject_id=s["subject_id"],
                session_date=s["session_date"],
                start_time=s["start_time"],
                duration_minutes=s["duration_minutes"],
                topic_focus=s["topic_focus"],
                status=s["status"],
                created_at=now,
                updated_at=now,
            )
            session_entities.append(sess)
        db.add_all(session_entities)

        # 5. Compute and save priority recommendations if requested
        if req.include_recommendations:
            priorities_data = AISchedulingEngine.compute_priorities_and_recommendations(
                subjects=subjects,
                start_date=req.start_date,
                total_available_hours=total_hours,
            )
            rec_entities = []
            for p in priorities_data:
                rec = PriorityRecommendation(
                    id=str(uuid.uuid4()),
                    study_plan_id=plan_id,
                    subject_id=p["subject_id"],
                    priority_rank=p["priority_rank"],
                    urgency_score=p["urgency_score"],
                    recommendation_text=p["recommendation_text"],
                    created_at=now,
                    updated_at=now,
                )
                rec_entities.append(rec)
            db.add_all(rec_entities)

        db.commit()
        db.refresh(study_plan)
        return study_plan

    @staticmethod
    def update_session_status(
        db: Session, session_id: str, new_status: str
    ) -> Optional[StudySession]:
        session = db.query(StudySession).filter(StudySession.id == session_id).first()
        if not session:
            return None
        setattr(session, "status", new_status)
        setattr(session, "updated_at", datetime.now(timezone.utc))
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def delete_schedule(db: Session, plan_id: str) -> bool:
        plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
        if not plan:
            return False
        db.delete(plan)
        db.commit()
        return True
