from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

class StartTrialRequest(BaseModel):
    plan_slug: str = Field(..., description="The slug of the plan to start a trial for.")

@router.post("/public/start-trial-new")
async def start_trial_new(request: StartTrialRequest):
    """
    Public endpoint to initiate a trial.
    """
    return {"message": f"Trial for plan '{request.plan_slug}' initiated successfully. Please complete your registration to access it."}
