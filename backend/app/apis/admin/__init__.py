from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime, timezone
import databutton as db
from app.libs.trial_scheduler import get_trial_conversion_stats, generate_cron_instructions

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.audit_logging import audit_logger

router = APIRouter()

class AdminStatsResponse(BaseModel):
    trial_stats: Dict[str, Any]
    system_health: Dict[str, Any]
    recent_activity: Dict[str, Any]

class CronInstructionsResponse(BaseModel):
    instructions: str
    endpoints: List[str]

@router.get("/trial-stats", response_model=AdminStatsResponse)
async def get_trial_statistics(user: AuthorizedUser):
    """Get comprehensive trial conversion statistics for admin dashboard.
    
    SECURITY: Results are scoped to the user's account to prevent cross-tenant data access.
    """
    with audit_logger("get_trial_statistics", user=user) as logger:
        try:
            repo = PaymentRepository(user.sub)
            account_id = await repo._get_user_account_id()
            
            # Get account-specific trial conversion statistics
            trial_stats = await get_account_trial_stats(account_id)
            
            # System health check
            system_health = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "database_connected": True,  # If we got stats, DB is connected
                "stripe_configured": bool(db.secrets.get("STRIPE_SECRET_KEY")),
                "scheduler_ready": True  # Jobs endpoint is available
            }
            
            # Recent activity (placeholder - would be expanded with real metrics)
            recent_activity = {
                "last_trial_conversion_check": datetime.now(timezone.utc).isoformat(),
                "pending_conversions": trial_stats.get('expired_trials', 0),
                "active_trials": trial_stats.get('active_trials', 0)
            }
            
            response = AdminStatsResponse(
                trial_stats=trial_stats,
                system_health=system_health,
                recent_activity=recent_activity
            )
            logger.success(
                "Successfully retrieved trial statistics.",
                details={"account_id": account_id},
            )
            return response

        except Exception as e:
            logger.error(
                f"Error fetching trial statistics: {e}",
                details={"error": str(e)},
            )
            print(f"Error fetching trial statistics for user {user.sub}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get trial statistics: {str(e)}")

@router.get("/cron-setup", response_model=CronInstructionsResponse)
async def get_cron_setup_instructions(user: AuthorizedUser):
    """Get instructions for setting up automated trial conversion.
    
    SECURITY: Requires authentication to access setup instructions.
    """
    with audit_logger("get_cron_setup_instructions", user=user) as logger:
        response = CronInstructionsResponse(
            instructions=generate_cron_instructions(),
            endpoints=[
                "/routes/jobs/run-trial-conversion",
                "/routes/notifications/send-trial-reminders",
                "/routes/jobs/health"
            ]
        )
        logger.success("Successfully retrieved cron setup instructions.")
        return response

async def get_account_trial_stats(account_id) -> Dict[str, Any]:
    """Get trial statistics scoped to a specific account."""
    import asyncpg
    from app.env import mode, Mode
    
    database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
    if not database_url:
        raise Exception("Database URL not configured")
    
    conn = await asyncpg.connect(database_url)
    try:
        # SECURITY: Added WHERE account_id = $1 to filter by user's account
        stats_query = """
            SELECT 
                COUNT(*) FILTER (WHERE status = 'trial') as active_trials,
                COUNT(*) FILTER (WHERE status = 'trial' AND trial_end_date < CURRENT_TIMESTAMP) as expired_trials,
                COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
                COUNT(*) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
                AVG(EXTRACT(EPOCH FROM (trial_end_date - trial_start_date))/86400) as avg_trial_length_days
            FROM user_subscriptions
            WHERE account_id = $1
            AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        """
        
        result = await conn.fetchrow(stats_query, account_id)
        return dict(result) if result else {}
        
    finally:
        await conn.close()
