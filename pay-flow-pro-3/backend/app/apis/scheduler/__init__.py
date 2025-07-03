
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.libs.dunning_logic import process_dunning_for_all_tenants
import databutton as db

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])

@router.post("/run-dunning")
async def run_dunning_job(background_tasks: BackgroundTasks, scheduler_key: str | None = None):
    """
    Triggers the dunning process to check for overdue invoices and send reminders.
    This endpoint is designed to be called by a scheduler and is protected by a secret key.
    """
    expected_key = db.secrets.get("SCHEDULER_SECRET_KEY")
    
    if not expected_key or scheduler_key != expected_key:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid scheduler key.")

    print("Scheduler endpoint triggered: Adding dunning process to background tasks.")
    background_tasks.add_task(process_dunning_for_all_tenants)
    
    return {"message": "Dunning process has been successfully initiated in the background."}
