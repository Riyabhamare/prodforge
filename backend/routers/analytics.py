# backend/routers/analytics.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models.database import get_db, Task, Subtask, Analytics, Habit
from routers.users import get_current_user

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

    all_tasks = db.query(Task).filter(Task.user_id == user.id).all()
    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == "done")
    missed = sum(1 for t in all_tasks if t.status == "missed")
    pending = sum(1 for t in all_tasks if t.status == "pending")
    in_progress = sum(1 for t in all_tasks if t.status == "in_progress")

    completion_rate = int((completed / total * 100)) if total > 0 else 0

    # High risk tasks
    high_risk = [
        {"id": t.id, "title": t.title, "risk_score": t.risk_score,
         "deadline": t.deadline, "completion_probability": t.completion_probability}
        for t in all_tasks
        if (t.risk_score or 0) > 0.6 and t.status not in ["done", "missed"]
    ]

    # Upcoming deadlines (next 7 days)
    now = datetime.utcnow()
    upcoming = [
        {"id": t.id, "title": t.title, "deadline": t.deadline,
         "status": t.status, "risk_score": t.risk_score}
        for t in all_tasks
        if t.deadline and now <= t.deadline <= now + timedelta(days=7)
        and t.status not in ["done", "missed"]
    ]
    upcoming.sort(key=lambda x: x["deadline"])

    # Habits
    habits = db.query(Habit).filter(Habit.user_id == user.id).all()

    return {
        "user": {
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "productivity_score": user.productivity_score
        },
        "stats": {
            "total_tasks": total,
            "completed": completed,
            "missed": missed,
            "pending": pending,
            "in_progress": in_progress,
            "completion_rate": completion_rate,
        },
        "high_risk_tasks": high_risk,
        "upcoming_deadlines": upcoming[:5],
        "habits": [
            {"id": h.id, "name": h.name, "streak": h.streak, "frequency": h.frequency}
            for h in habits
        ]
    }


@router.get("/weekly")
async def get_weekly_analytics(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    now = datetime.utcnow()

    weekly_data = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)

        completed = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status == "done",
            Task.updated_at >= day_start,
            Task.updated_at <= day_end
        ).count()

        missed = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status == "missed",
            Task.updated_at >= day_start,
            Task.updated_at <= day_end
        ).count()

        weekly_data.append({
            "day": day.strftime("%a"),
            "date": day.strftime("%Y-%m-%d"),
            "completed": completed,
            "missed": missed,
            "score": min(100, completed * 20)
        })

    return {"weekly": weekly_data}