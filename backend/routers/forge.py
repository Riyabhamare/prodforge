from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models.database import get_db
from services.gemini import forge_task, get_rescue_plan, get_risk_prediction
from routers.users import get_current_user

router = APIRouter()

class ForgeRequest(BaseModel):
    description: str
    deadline: str

class RescueRequest(BaseModel):
    task_title: str
    deadline: str
    remaining_subtasks: list[str] = []

class RiskRequest(BaseModel):
    task_title: str
    deadline: str
    completed_subtasks: int = 0
    total_subtasks: int = 1

@router.post("/forge", response_model=None)
async def forge_new_task(req: ForgeRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    result = forge_task(req.description, req.deadline)
    return result

@router.post("/rescue", response_model=None)
async def emergency_rescue(req: RescueRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    result = get_rescue_plan(req.task_title, req.deadline, req.remaining_subtasks)
    return result

@router.post("/risk", response_model=None)
async def predict_risk(req: RiskRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    result = get_risk_prediction(req.task_title, req.deadline, req.completed_subtasks, req.total_subtasks)
    return result