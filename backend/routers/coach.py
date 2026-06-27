# backend/routers/coach.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db, Task, Habit
from services.gemini import get_coaching_insight
from routers.users import get_current_user

router = APIRouter()


@router.get("/insight")
async def get_daily_insight(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

    completed = db.query(Task).filter(
        Task.user_id == user.id, Task.status == "done"
    ).count()
    missed = db.query(Task).filter(
        Task.user_id == user.id, Task.status == "missed"
    ).count()

    pending_tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status.in_(["pending", "in_progress"])
    ).limit(5).all()

    habits = db.query(Habit).filter(Habit.user_id == user.id).all()
    max_streak = max((h.streak for h in habits), default=0)

    insight = get_coaching_insight(
        user_name=user.name or "there",
        tasks_completed=completed,
        tasks_missed=missed,
        streak=max_streak,
        pending_tasks=[t.title for t in pending_tasks]
    )
    return insight


@router.post("/habits")
async def create_habit(
    name: str,
    frequency: str = "daily",
    token: str = None,
    db: Session = Depends(get_db)
):
    import uuid
    user = get_current_user(token, db)
    habit = Habit(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=name,
        streak=0,
        frequency=frequency
    )
    db.add(habit)
    db.commit()
    return {"message": "Habit created", "id": habit.id, "name": habit.name}


@router.patch("/habits/{habit_id}/complete")
async def complete_habit(habit_id: str, token: str, db: Session = Depends(get_db)):
    from datetime import datetime
    user = get_current_user(token, db)
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == user.id
    ).first()
    if not habit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Habit not found")

    habit.streak += 1
    habit.last_completed = datetime.utcnow()
    db.commit()
    return {"message": "Habit completed!", "streak": habit.streak}