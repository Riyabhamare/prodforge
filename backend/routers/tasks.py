# backend/routers/tasks.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from models.database import get_db, Task, Subtask, User
from services.gemini import (
    forge_task, analyze_risk,
    generate_rescue_plan, simulate_delay
)
from routers.users import get_current_user

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[int] = 3


class TaskForgeRequest(BaseModel):
    title: str
    deadline_days: int
    description: Optional[str] = None


class SubtaskUpdate(BaseModel):
    status: str


class SimulateDelayRequest(BaseModel):
    delay_days: int


class RescueRequest(BaseModel):
    deadline_hours: int


# ─── Routes ───────────────────────────────────────────────

@router.post("/forge")
async def forge_new_task(
    request: TaskForgeRequest,
    token: str,
    db: Session = Depends(get_db)
):
    """
    AI-powered task creation.
    Breaks task into subtasks, calculates risk, creates schedule.
    """
    user = get_current_user(token, db)

    # Get user history for better AI analysis
    completed = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status == "done"
    ).count()
    missed = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status == "missed"
    ).count()

    user_history = {
        "completion_rate": int((completed / max(completed + missed, 1)) * 100),
        "tasks_completed": completed,
        "tasks_missed": missed,
        "peak_hours": f"{user.peak_hours.get('start', 9)}AM-{user.peak_hours.get('end', 17)}PM"
    }

    # Call Gemini (or mock)
    ai_result = forge_task(request.title, request.deadline_days, user_history)

    # Calculate deadline datetime
    from datetime import timedelta
    deadline_dt = datetime.utcnow() + timedelta(days=request.deadline_days)

    # Create task in DB
    task = Task(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=request.title,
        description=request.description,
        deadline=deadline_dt,
        status="pending",
        priority=1 if ai_result["risk_level"] == "critical" else 2 if ai_result["risk_level"] == "high" else 3,
        risk_score=ai_result["risk_score"],
        completion_probability=ai_result["completion_probability"],
        ai_plan=ai_result,
        total_estimated_hours=ai_result["total_estimated_hours"],
        rescue_mode=ai_result["rescue_needed"]
    )
    db.add(task)
    db.flush()

    # Create subtasks in DB
    for idx, st in enumerate(ai_result["subtasks"]):
        subtask = Subtask(
            id=str(uuid.uuid4()),
            task_id=task.id,
            title=st["title"],
            estimated_minutes=st["estimated_minutes"],
            status="pending",
            order_index=idx
        )
        db.add(subtask)

    db.commit()
    db.refresh(task)

    return {
        "task_id": task.id,
        "title": task.title,
        "deadline": task.deadline,
        "risk_score": task.risk_score,
        "completion_probability": task.completion_probability,
        "risk_level": ai_result["risk_level"],
        "rescue_needed": ai_result["rescue_needed"],
        "advice": ai_result["advice"],
        "subtasks": ai_result["subtasks"],
        "total_estimated_hours": task.total_estimated_hours
    }


@router.get("/")
async def get_all_tasks(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    tasks = db.query(Task).filter(Task.user_id == user.id).order_by(Task.created_at.desc()).all()

    result = []
    for task in tasks:
        subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).all()
        done_count = sum(1 for s in subtasks if s.status == "done")
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "deadline": task.deadline,
            "status": task.status,
            "priority": task.priority,
            "risk_score": task.risk_score,
            "completion_probability": task.completion_probability,
            "rescue_mode": task.rescue_mode,
            "total_subtasks": len(subtasks),
            "completed_subtasks": done_count,
            "progress_percent": int((done_count / len(subtasks) * 100)) if subtasks else 0,
            "created_at": task.created_at
        })
    return result


@router.get("/{task_id}")
async def get_task(task_id: str, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).order_by(Subtask.order_index).all()

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "deadline": task.deadline,
        "status": task.status,
        "priority": task.priority,
        "risk_score": task.risk_score,
        "completion_probability": task.completion_probability,
        "ai_plan": task.ai_plan,
        "rescue_mode": task.rescue_mode,
        "total_estimated_hours": task.total_estimated_hours,
        "subtasks": [
            {
                "id": s.id,
                "title": s.title,
                "estimated_minutes": s.estimated_minutes,
                "status": s.status,
                "order_index": s.order_index
            }
            for s in subtasks
        ]
    }


@router.patch("/{task_id}/status")
async def update_task_status(
    task_id: str,
    status: str,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    valid_statuses = ["pending", "in_progress", "done", "missed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    task.status = status
    task.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Status updated", "status": status}


@router.patch("/subtasks/{subtask_id}/status")
async def update_subtask_status(
    subtask_id: str,
    body: SubtaskUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    # Verify ownership
    task = db.query(Task).filter(Task.id == subtask.task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=403, detail="Not authorized")

    subtask.status = body.status
    db.commit()

    # Check if all subtasks done → mark task done
    all_subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).all()
    if all(s.status == "done" for s in all_subtasks):
        task.status = "done"
        task.updated_at = datetime.utcnow()
        db.commit()

    return {"message": "Subtask updated", "status": body.status}


@router.post("/{task_id}/rescue")
async def get_rescue_plan(
    task_id: str,
    body: RescueRequest,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    subtasks = db.query(Subtask).filter(
        Subtask.task_id == task.id,
        Subtask.status != "done"
    ).all()

    remaining = [s.title for s in subtasks]
    plan = generate_rescue_plan(task.title, body.deadline_hours, remaining)

    task.rescue_mode = True
    db.commit()

    return plan


@router.post("/{task_id}/simulate-delay")
async def simulate_task_delay(
    task_id: str,
    body: SimulateDelayRequest,
    token: str,
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.deadline:
        raise HTTPException(status_code=400, detail="Task has no deadline set")

    days_remaining = max(1, (task.deadline - datetime.utcnow()).days)

    result = simulate_delay(
        task.title,
        task.completion_probability or 0.7,
        body.delay_days,
        days_remaining
    )
    return result


@router.delete("/{task_id}")
async def delete_task(task_id: str, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}