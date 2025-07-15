"""Trial conversion scheduling utilities.

This module provides utilities for scheduling and managing trial conversions.
Since we can't run background tasks in the Databutton environment, we rely on
external scheduling services to call our job endpoints.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import databutton as db
import asyncpg
from app.env import mode, Mode

async def get_trials_expiring_soon(days_ahead: int = 1) -> List[Dict[str, Any]]:
    """Get trials that will expire within the specified number of days.
    
    This can be used for sending reminder notifications before conversion.
    """
    database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
    if not database_url:
        raise Exception("Database URL not configured")
    
    conn = await asyncpg.connect(database_url)
    try:
        # Get trials expiring within the next N days
        future_date = datetime.now(timezone.utc) + timedelta(days=days_ahead)
        
        query = """
            SELECT us.*, sp.slug as plan_slug, sp.name as plan_name
            FROM user_subscriptions us
            LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.status = 'trial' 
            AND us.trial_end_date <= $1
            AND us.trial_end_date > CURRENT_TIMESTAMP
            AND us.stripe_customer_id IS NOT NULL
            ORDER BY us.trial_end_date ASC
        """
        
        rows = await conn.fetch(query, future_date)
        return [dict(row) for row in rows]
        
    finally:
        await conn.close()

async def get_trial_conversion_stats() -> Dict[str, Any]:
    """Get statistics about trial conversions."""
    database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
    if not database_url:
        raise Exception("Database URL not configured")
    
    conn = await asyncpg.connect(database_url)
    try:
        stats_query = """
            SELECT 
                COUNT(*) FILTER (WHERE status = 'trial') as active_trials,
                COUNT(*) FILTER (WHERE status = 'trial' AND trial_end_date < CURRENT_TIMESTAMP) as expired_trials,
                COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
                COUNT(*) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
                AVG(EXTRACT(EPOCH FROM (trial_end_date - trial_start_date))/86400) as avg_trial_length_days
            FROM user_subscriptions
            WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        """
        
        result = await conn.fetchrow(stats_query)
        return dict(result) if result else {}
        
    finally:
        await conn.close()

def generate_cron_instructions() -> str:
    """Generate instructions for setting up external cron job."""
    return """
    To set up automated trial conversion, you need to call the trial conversion endpoint daily.
    
    ## Option 1: GitHub Actions (Recommended)
    
    Create `.github/workflows/trial-conversion.yml`:
    
    ```yaml
    name: Daily Trial Conversion
    on:
      schedule:
        - cron: '0 9 * * *'  # Run daily at 9 AM UTC
      workflow_dispatch:  # Allow manual triggering
    
    jobs:
      convert-trials:
        runs-on: ubuntu-latest
        steps:
          - name: Run Trial Conversion
            run: |
              curl -X POST "https://api.databutton.com/_projects/YOUR_PROJECT_ID/dbtn/prodx/app/routes/jobs/run-trial-conversion" \
                -H "Content-Type: application/json" \
                -w "HTTP Status: %{http_code}\n"
    ```
    
    ## Option 2: Vercel Cron (if using Vercel)
    
    Add to `vercel.json`:
    
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/trial-conversion",
          "schedule": "0 9 * * *"
        }
      ]
    }
    ```
    
    ## Option 3: External Cron Service
    
    Set up a daily cron job to call:
    POST https://api.databutton.com/_projects/YOUR_PROJECT_ID/dbtn/prodx/app/routes/jobs/run-trial-conversion
    
    ## Manual Testing
    
    You can manually trigger the conversion job by calling:
    POST /routes/jobs/run-trial-conversion
    """
