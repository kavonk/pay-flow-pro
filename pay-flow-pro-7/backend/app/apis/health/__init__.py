
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
import stripe
import databutton as db
from datetime import datetime, timedelta, timezone

from app.auth import AuthorizedUser

router = APIRouter()

class HealthStatus(BaseModel):
    database: str
    stripe: str
    dunning_job: str
    trial_conversion_job: str

@router.get("/health-check", response_model=HealthStatus)
async def health_check(user: AuthorizedUser):
    # Database check
    db_status = "ok"
    try:
        conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
        await conn.execute("SELECT 1")
        await conn.close()
    except Exception as e:
        print(f"Database health check failed: {e}")
        db_status = "error"

    # Stripe check
    stripe_status = "ok"
    try:
        stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")
        stripe.Account.retrieve()
    except Exception as e:
        print(f"Stripe health check failed: {e}")
        stripe_status = "error"
        
    # Cron job status check
    dunning_status = "error"
    trial_status = "error"
    
    try:
        conn = await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))
        
        # Check dunning job
        dunning_last_run = await conn.fetchval(
            "SELECT last_run_timestamp FROM cron_jobs WHERE job_name = 'dunning_job'"
        )
        if dunning_last_run and (datetime.now(timezone.utc) - dunning_last_run) < timedelta(hours=25):
            dunning_status = "ok"
        else:
            print(f"Dunning job is stale. Last run: {dunning_last_run}")

        # Check trial conversion job
        trial_last_run = await conn.fetchval(
            "SELECT last_run_timestamp FROM cron_jobs WHERE job_name = 'trial_conversion_job'"
        )
        if trial_last_run and (datetime.now(timezone.utc) - trial_last_run) < timedelta(hours=25):
            trial_status = "ok"
        else:
            print(f"Trial conversion job is stale. Last run: {trial_last_run}")
            
        await conn.close()
    except Exception as e:
        print(f"Cron job health check failed: {e}")
        # Statuses will remain 'error'

    return HealthStatus(
        database=db_status,
        stripe=stripe_status,
        dunning_job=dunning_status,
        trial_conversion_job=trial_status,
    )
