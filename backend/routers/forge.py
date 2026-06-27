from fastapi import APIRouter, Depends
from pydantic import BaseModel
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

@router.post("/forge")
async def forge_new_task(req: ForgeRequest, user=Depends(get_current_user)):
    result = forge_task(req.description, req.deadline)
    return result

@router.post("/rescue")
async def emergency_rescue(req: RescueRequest, user=Depends(get_current_user)):
    result = get_rescue_plan(req.task_title, req.deadline, req.remaining_subtasks)
    return result

@router.post("/risk")
async def predict_risk(req: RiskRequest, user=Depends(get_current_user)):
    result = get_risk_prediction(req.task_title, req.deadline, req.completed_subtasks, req.total_subtasks)
    return result