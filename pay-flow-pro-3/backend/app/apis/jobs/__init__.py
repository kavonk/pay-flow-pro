from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import databutton as db
from app.apis.subscriptions import process_expired_trials

router = APIRouter()

class JobResponse(BaseModel):
    success: bool
    message: str
    details: dict = {}

class TrialConversionJobResponse(BaseModel):
    success: bool
    converted_count: int
    failed_count: int
    message: str

@router.post("/run-trial-conversion", response_model=TrialConversionJobResponse)
async def run_trial_conversion_job():
    """Run the automated trial-to-paid conversion job.
    
    This endpoint should be called daily by an external scheduler
    (like GitHub Actions, Vercel Cron, or external cron service).
    """
    try:
        print(f"Starting trial conversion job at {datetime.now(timezone.utc)}")
        
        # Process expired trials
        converted_count = await process_expired_trials()
        
        message = f"Trial conversion job completed successfully. Converted {converted_count} trials to Basic plan."
        print(message)
        
        return TrialConversionJobResponse(
            success=True,
            converted_count=converted_count,
            failed_count=0,  # process_expired_trials handles failures internally
            message=message
        )
        
    except Exception as e:
        error_message = f"Trial conversion job failed: {str(e)}"
        print(error_message)
        
        return TrialConversionJobResponse(
            success=False,
            converted_count=0,
            failed_count=1,
            message=error_message
        )

@router.get("/health")
async def job_health_check():
    """Health check for job endpoints."""
    return JobResponse(
        success=True,
        message="Job endpoints are healthy",
        details={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "available_jobs": ["trial-conversion"]
        }
    )
