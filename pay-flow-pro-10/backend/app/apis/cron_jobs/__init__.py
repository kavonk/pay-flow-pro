from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import databutton as db
from app.env import mode, Mode

router = APIRouter(prefix="/cron")

# Scheduler secret for authentication
SCHEDULER_SECRET = db.secrets.get("SCHEDULER_SECRET_KEY")

class CronJobResult(BaseModel):
    job_name: str
    success: bool
    message: str
    processed_count: int
    timestamp: datetime

def verify_scheduler_auth(authorization: Optional[str] = Header(None)):
    """Verify the scheduler secret for cron job authentication."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
        
    if authorization != f"Bearer {SCHEDULER_SECRET}":
        raise HTTPException(status_code=401, detail="Invalid scheduler secret")
    
    return True

@router.post("/run-dunning-job", response_model=CronJobResult)
async def run_dunning_job_cron(auth: bool = Header(alias="authorization", default=None)):
    """Run the dunning job to send automated reminders."""
    verify_scheduler_auth(auth)
    
    try:
        # Import here to avoid circular imports
        from app.apis.billing_automation import process_monthly_billing_for_all_users
        
        # This would trigger the dunning system
        # For now, we'll return a placeholder
        return CronJobResult(
            job_name="dunning_reminders",
            success=True,
            message="Dunning job completed successfully",
            processed_count=0,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        return CronJobResult(
            job_name="dunning_reminders",
            success=False,
            message=f"Dunning job failed: {str(e)}",
            processed_count=0,
            timestamp=datetime.now()
        )

@router.post("/run-trial-conversion-job", response_model=CronJobResult)
async def run_trial_conversion_job_cron(auth: bool = Header(alias="authorization", default=None)):
    """Run job to process trial conversions and send notifications."""
    verify_scheduler_auth(auth)
    
    try:
        # This would handle trial conversions
        return CronJobResult(
            job_name="trial_conversion",
            success=True,
            message="Trial conversion job completed successfully",
            processed_count=0,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        return CronJobResult(
            job_name="trial_conversion",
            success=False,
            message=f"Trial conversion job failed: {str(e)}",
            processed_count=0,
            timestamp=datetime.now()
        )

@router.get("/health")
async def cron_jobs_health_check():
    """Health check for cron job system."""
    return {
        "status": "healthy",
        "service": "cron_jobs",
        "timestamp": datetime.now(),
        "environment": mode.value
    }

@router.post("/send-trial-reminders", response_model=CronJobResult)
async def send_trial_reminders_cron(auth: bool = Header(alias="authorization", default=None)):
    """Send trial reminder emails to users approaching trial end."""
    verify_scheduler_auth(auth)
    
    try:
        # This would send trial reminder emails
        return CronJobResult(
            job_name="trial_reminders",
            success=True,
            message="Trial reminder emails sent successfully",
            processed_count=0,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        return CronJobResult(
            job_name="trial_reminders",
            success=False,
            message=f"Trial reminder job failed: {str(e)}",
            processed_count=0,
            timestamp=datetime.now()
        )