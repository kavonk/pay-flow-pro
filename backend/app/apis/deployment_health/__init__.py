"""Deployment health check API endpoints for external monitoring."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from app.libs.deployment_automation import DeploymentHealthChecker
from app.libs.deployment_logger import DeploymentLogger
from uuid import uuid4

router = APIRouter()

class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint."""
    timestamp: str
    overall_status: str  # 'healthy', 'degraded', 'unhealthy', 'error'
    checks: Dict[str, Dict[str, str]]
    deployment_id: str
    uptime_seconds: Optional[float] = None
    version: Optional[str] = None
    error: Optional[str] = None

class DeploymentHealthStatusResponse(BaseModel):
    """Response model for deployment health status."""
    status: str
    message: str
    last_deployment: Optional[str] = None
    failed_deployments_count: int = 0
    healthy: bool

@router.get("/deployment-health-check", response_model=HealthCheckResponse)
async def deployment_health_check():
    """Comprehensive health check endpoint for external monitoring.
    
    This endpoint provides a detailed health status including:
    - Database connectivity
    - Environment configuration
    - External service availability
    - Overall system health
    
    Returns HTTP 200 with detailed status information.
    External monitoring tools can parse the 'overall_status' field.
    """
    try:
        checker = DeploymentHealthChecker()
        health_status = await checker.run_health_check()
        
        return HealthCheckResponse(
            timestamp=health_status['timestamp'],
            overall_status=health_status['overall_status'],
            checks=health_status['checks'],
            deployment_id=health_status['deployment_id'],
            error=health_status.get('error')
        )
        
    except Exception as e:
        # Always return 200 but with error status for monitoring tools
        return HealthCheckResponse(
            timestamp=datetime.now().isoformat(),
            overall_status='error',
            checks={},
            deployment_id=str(uuid4()),
            error=str(e)
        )

@router.get("/deployment-status", response_model=DeploymentHealthStatusResponse)
async def deployment_status_check():
    """Simple deployment health check for quick monitoring.
    
    Returns a simplified health status focused on deployment success/failure.
    Useful for basic uptime monitoring and alerting.
    """
    try:
        logger = DeploymentLogger()
        
        # Get recent deployment status from logs
        database_url = logger._get_database_url()
        if not database_url:
            return DeploymentHealthStatusResponse(
                status='error',
                message='Database configuration unavailable',
                healthy=False
            )
        
        import asyncpg
        conn = await asyncpg.connect(database_url)
        
        # Check for recent failed deployments
        failed_count = await conn.fetchval(
            """
            SELECT COUNT(*) 
            FROM deployment_logs 
            WHERE level = 'ERROR' 
            AND timestamp > NOW() - INTERVAL '1 hour'
            AND step LIKE '%deployment%'
            """
        )
        
        # Get last successful deployment
        last_success = await conn.fetchval(
            """
            SELECT timestamp 
            FROM deployment_logs 
            WHERE level = 'INFO' 
            AND message LIKE '%completed successfully%'
            ORDER BY timestamp DESC 
            LIMIT 1
            """
        )
        
        await conn.close()
        
        # Determine health status
        if failed_count > 3:
            status = 'critical'
            message = f'Multiple deployment failures detected ({failed_count} in last hour)'
            healthy = False
        elif failed_count > 0:
            status = 'warning'
            message = f'{failed_count} deployment failures in last hour'
            healthy = True
        else:
            status = 'healthy'
            message = 'No recent deployment failures detected'
            healthy = True
        
        return DeploymentHealthStatusResponse(
            status=status,
            message=message,
            last_deployment=last_success.isoformat() if last_success else None,
            failed_deployments_count=failed_count,
            healthy=healthy
        )
        
    except Exception as e:
        return DeploymentHealthStatusResponse(
            status='error',
            message=f'Health check failed: {str(e)}',
            healthy=False
        )

@router.get("/deployment-cron-health")
async def deployment_cron_health_check():
    """Health check endpoint specifically for cron job monitoring.
    
    This endpoint can be called by external cron monitoring services
    to verify that scheduled tasks are running properly.
    """
    try:
        logger = DeploymentLogger()
        deployment_id = str(uuid4())
        
        await logger.log_info(
            deployment_id=deployment_id,
            step="cron_health_check",
            message="Cron job health check executed successfully"
        )
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "message": "Cron jobs monitoring system operational",
            "deployment_id": deployment_id
        }
        
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "message": f"Cron health check failed: {str(e)}",
            "deployment_id": str(uuid4())
        }