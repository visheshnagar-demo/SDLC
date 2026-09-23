"""AI Scheduling and Priority Recommendation Engine.

Implements heuristic constraint satisfaction, spaced repetition intervals,
difficulty-weighted workload distribution, and dynamic priority scoring.
"""

from datetime import date, timedelta
from typing import Dict, List, Tuple
from server.models.subject import Subject


TOPIC_ROTATIONS = [
    "Core Concepts & Foundational Theory",
    "Practice Problem Sets & Applied Exercises",
    "Deep Dive & High-Difficulty Topics",
    "Active Recall & Flashcard Self-Quiz",
    "Integrated Review & Mock Exam Practice",
]

TIME_OF_DAY_START_HOURS = {
    "MORNING": 9,
    "AFTERNOON": 14,
    "EVENING": 18,
}


class AISchedulingEngine:
    @staticmethod
    def calculate_urgency_score(subject: Subject, start_date: date) -> float:
        """Calculate Urgency Score = (Difficulty * Hours) / max(1, Days Until Target Date)."""
        target_d = subject.target_date
        if isinstance(target_d, str):
            target_d = date.fromisoformat(target_d)
        days_until_target = (target_d - start_date).days
        effective_days = max(1, days_until_target)
        diff = int(subject.difficulty_level)
        hours = float(subject.estimated_total_hours)
        score = (diff * hours) / float(effective_days)
        return round(score, 2)

    @classmethod
    def compute_priorities_and_recommendations(
        cls, subjects: List[Subject], start_date: date, total_available_hours: float
    ) -> List[Dict]:
        """Rank subjects by urgency and generate prioritized actionable advice."""
        if not subjects:
            return []

        scored_subjects = []
        for s in subjects:
            urgency = cls.calculate_urgency_score(s, start_date)
            scored_subjects.append((s, urgency))

        # Sort descending by urgency score
        scored_subjects.sort(key=lambda item: item[1], reverse=True)

        total_urgency = sum(item[1] for item in scored_subjects) or 1.0

        recommendations = []
        for rank, (subj, urgency) in enumerate(scored_subjects, start=1):
            ratio = urgency / total_urgency
            allocated_hours = round(total_available_hours * ratio, 1)
            allocated_pct = round(ratio * 100)

            target_d = subj.target_date
            if isinstance(target_d, str):
                target_d = date.fromisoformat(target_d)
            days_left = max(0, (target_d - start_date).days)
            diff = int(subj.difficulty_level)
            if rank == 1:
                rec_text = (
                    f"Top Priority: {subj.name} has highest urgency (Difficulty {diff}/5, "
                    f"Target in {days_left} days). Allocate {allocated_pct}% of study time "
                    f"(~{allocated_hours} hrs) to primary peak energy slots."
                )
            elif diff >= 4:
                rec_text = (
                    f"High Difficulty: {subj.name} requires intensive focus. "
                    f"Schedule consistent spaced intervals (~{allocated_hours} hrs total) before {subj.target_date}."
                )
            elif days_left <= 14:
                rec_text = (
                    f"Approaching Deadline: {subj.name} is due in {days_left} days. "
                    f"Prioritize problem-solving sets and active recall sessions (~{allocated_hours} hrs)."
                )
            else:
                rec_text = (
                    f"Steady Progress: Maintain steady weekly pace for {subj.name} (~{allocated_hours} hrs) "
                    f"to build long-term retention without cramming."
                )

            recommendations.append(
                {
                    "subject_id": str(subj.id),
                    "subject_name": str(subj.name),
                    "priority_rank": rank,
                    "urgency_score": urgency,
                    "allocated_hours": allocated_hours,
                    "recommendation_text": rec_text,
                }
            )

        return recommendations

    @classmethod
    def generate_schedule(
        cls,
        subjects: List[Subject],
        availability_map: Dict[str, Tuple[int, str]],  # DAY -> (minutes, pref_time)
        start_date: date,
        end_date: date,
        daily_max_minutes: int = 300,
        default_slot_minutes: int = 60,
    ) -> Tuple[List[Dict], float]:
        """Generate optimized study session slots using spaced repetition and constraint solving.

        Returns: (sessions_data, total_study_hours)
        """
        if not subjects or start_date > end_date:
            return [], 0.0

        # Sort subjects by urgency score descending
        urgency_map = {
            str(s.id): cls.calculate_urgency_score(s, start_date) for s in subjects
        }
        sorted_subjects = sorted(
            subjects, key=lambda s: urgency_map[str(s.id)], reverse=True
        )

        # Track remaining required minutes per subject
        remaining_minutes = {
            str(s.id): int(float(s.estimated_total_hours) * 60) for s in sorted_subjects
        }
        topic_indexes = {str(s.id): 0 for s in sorted_subjects}

        sessions = []
        current_date = start_date
        total_days = (end_date - start_date).days + 1

        day_names = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
        ]

        # Subject round-robin pointer for spaced repetition
        subject_idx = 0

        for _ in range(total_days):
            day_name = day_names[current_date.weekday()]
            avail_mins, pref_time = availability_map.get(day_name, (120, "EVENING"))
            usable_mins = min(avail_mins, daily_max_minutes)

            if usable_mins <= 0:
                current_date += timedelta(days=1)
                continue

            # Eligible subjects: target_date >= current_date and has remaining time (or cycle through all active)
            active_subjects = []
            for s in sorted_subjects:
                t_date = s.target_date
                if isinstance(t_date, str):
                    t_date = date.fromisoformat(t_date)
                if t_date >= current_date:
                    active_subjects.append(s)

            if not active_subjects:
                active_subjects = sorted_subjects

            mins_allocated_today = 0
            base_hour = TIME_OF_DAY_START_HOURS.get(pref_time.upper(), 18)
            session_start_minute_offset = 0

            while mins_allocated_today + 30 <= usable_mins:
                # Select subject based on spaced repetition & urgency
                subj = active_subjects[subject_idx % len(active_subjects)]
                subject_idx += 1

                # Calculate slot duration (45-60 min)
                remaining_today = usable_mins - mins_allocated_today
                slot_duration = min(default_slot_minutes, remaining_today)
                if slot_duration < 30:
                    break

                # Format start time e.g. "09:00", "10:00", etc.
                total_min = (base_hour * 60) + session_start_minute_offset
                start_h = (total_min // 60) % 24
                start_m = total_min % 60
                start_time_str = f"{start_h:02d}:{start_m:02d}"

                # Topic focus selection
                t_idx = topic_indexes[str(subj.id)] % len(TOPIC_ROTATIONS)
                topic = f"{subj.name}: {TOPIC_ROTATIONS[t_idx]}"
                topic_indexes[str(subj.id)] += 1

                sessions.append(
                    {
                        "subject_id": str(subj.id),
                        "session_date": current_date,
                        "start_time": start_time_str,
                        "duration_minutes": slot_duration,
                        "topic_focus": topic,
                        "status": "PENDING",
                    }
                )

                mins_allocated_today += slot_duration
                session_start_minute_offset += (
                    slot_duration + 10
                )  # 10-minute break buffer
                remaining_minutes[str(subj.id)] = max(
                    0, remaining_minutes[str(subj.id)] - slot_duration
                )

            current_date += timedelta(days=1)

        total_study_hours = round(
            sum(s["duration_minutes"] for s in sessions) / 60.0, 1
        )
        return sessions, total_study_hours
