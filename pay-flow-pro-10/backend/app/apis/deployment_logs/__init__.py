from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncpg
import databutton as db
from app.env import mode, Mode

router = APIRouter(prefix="/deployment-logs")

# Note: This router should be mounted without auth dependencies for external monitoring

# Database connection
async def get_db_connection():
    database_url = (
        db.secrets.get("DATABASE_URL_DEV")
        if mode == Mode.DEV
        else db.secrets.get("DATABASE_URL_PROD")
    )
    return await asyncpg.connect(database_url)

# Pydantic models
class DeploymentLogEntry(BaseModel):
    id: str
    timestamp: datetime
    step: str
    message: str
    level: str
    commit_sha: Optional[str]
    branch_name: Optional[str]
    deployment_id: Optional[str]
    created_at: datetime

class DeploymentLogsResponse(BaseModel):
    logs: List[DeploymentLogEntry]
    total_count: int
    latest_deployment_status: str
    last_successful_deployment: Optional[datetime]

class CreateDeploymentLogRequest(BaseModel):
    step: str
    message: str
    level: str  # INFO, WARN, ERROR, FATAL
    commit_sha: Optional[str] = None
    branch_name: Optional[str] = None
    deployment_id: Optional[str] = None

@router.get("/", response_model=DeploymentLogsResponse)
async def get_deployment_logs(limit: int = 50, deployment_attempts: int = 5):
    """Get deployment logs from the last N deployment attempts.
    
    This endpoint is public to allow external monitoring tools to access logs.
    """
    conn = await get_db_connection()
    
    try:
        # Get the latest deployment attempts
        recent_deployments_query = """
            SELECT DISTINCT deployment_id, MAX(timestamp) as latest_timestamp
            FROM deployment_logs 
            WHERE deployment_id IS NOT NULL
            GROUP BY deployment_id
            ORDER BY latest_timestamp DESC
            LIMIT $1
        """
        
        deployment_ids = await conn.fetch(recent_deployments_query, deployment_attempts)
        
        if not deployment_ids:
            # If no deployment IDs, get latest logs by timestamp
            logs_query = """
                SELECT id, timestamp, step, message, level, commit_sha, 
                       branch_name, deployment_id, created_at
                FROM deployment_logs 
                ORDER BY timestamp DESC 
                LIMIT $1
            """
            logs = await conn.fetch(logs_query, limit)
        else:
            # Get logs for the recent deployments
            deployment_id_list = [str(row['deployment_id']) for row in deployment_ids]
            placeholders = ','.join([f'${i+1}' for i in range(len(deployment_id_list))])
            
            logs_query = f"""
                SELECT id, timestamp, step, message, level, commit_sha, 
                       branch_name, deployment_id, created_at
                FROM deployment_logs 
                WHERE deployment_id = ANY(ARRAY[{placeholders}]::UUID[])
                ORDER BY timestamp DESC 
                LIMIT ${len(deployment_id_list) + 1}
            """
            
            logs = await conn.fetch(logs_query, *deployment_id_list, limit)
        
        # Get total count
        count_result = await conn.fetchrow("SELECT COUNT(*) as total FROM deployment_logs")
        total_count = count_result['total'] if count_result else 0
        
        # Determine latest deployment status
        latest_status = "unknown"
        last_successful = None
        
        if logs:
            # Look for latest deployment status
            for log in logs:
                if log['step'] == 'deployment_complete':
                    latest_status = "success"
                    last_successful = log['timestamp']
                    break
                elif log['level'] in ['ERROR', 'FATAL'] and log['step'] in ['deployment_failed', 'build_failed']:
                    latest_status = "failed"
                    break
            
            # If no specific completion status found, check for recent errors
            if latest_status == "unknown":
                recent_errors = [log for log in logs[:10] if log['level'] in ['ERROR', 'FATAL']]
                if recent_errors:
                    latest_status = "failed"
                else:
                    latest_status = "in_progress"
        
        # Convert logs to response format
        log_entries = [
            DeploymentLogEntry(
                id=str(log['id']),
                timestamp=log['timestamp'],
                step=log['step'],
                message=log['message'],
                level=log['level'],
                commit_sha=log['commit_sha'],
                branch_name=log['branch_name'],
                deployment_id=str(log['deployment_id']) if log['deployment_id'] else None,
                created_at=log['created_at']
            )
            for log in logs
        ]
        
        return DeploymentLogsResponse(
            logs=log_entries,
            total_count=total_count,
            latest_deployment_status=latest_status,
            last_successful_deployment=last_successful
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch deployment logs: {str(e)}")
    finally:
        await conn.close()

@router.post("/log", response_model=DeploymentLogEntry)
async def create_deployment_log(request: CreateDeploymentLogRequest):
    """Create a new deployment log entry.
    
    This endpoint can be called during deployment processes to log progress.
    """
    conn = await get_db_connection()
    
    try:
        # Validate level
        valid_levels = ['INFO', 'WARN', 'ERROR', 'FATAL']
        if request.level not in valid_levels:
            raise HTTPException(status_code=400, detail=f"Invalid level. Must be one of: {valid_levels}")
        
        insert_query = """
            INSERT INTO deployment_logs (step, message, level, commit_sha, branch_name, deployment_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, timestamp, step, message, level, commit_sha, branch_name, deployment_id, created_at
        """
        
        result = await conn.fetchrow(
            insert_query,
            request.step,
            request.message,
            request.level,
            request.commit_sha,
            request.branch_name,
            request.deployment_id
        )
        
        return DeploymentLogEntry(
            id=str(result['id']),
            timestamp=result['timestamp'],
            step=result['step'],
            message=result['message'],
            level=result['level'],
            commit_sha=result['commit_sha'],
            branch_name=result['branch_name'],
            deployment_id=str(result['deployment_id']) if result['deployment_id'] else None,
            created_at=result['created_at']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create deployment log: {str(e)}")
    finally:
        await conn.close()

@router.get("/health")
async def deployment_logs_health_check():
    """Health check for deployment logs system."""
    conn = await get_db_connection()
    
    try:
        # Test database connection and get recent log count
        result = await conn.fetchrow(
            "SELECT COUNT(*) as count FROM deployment_logs WHERE timestamp > NOW() - INTERVAL '24 hours'"
        )
        recent_logs = result['count'] if result else 0
        
        return {
            "status": "healthy",
            "service": "deployment_logs",
            "timestamp": datetime.now(),
            "recent_logs_24h": recent_logs
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
    finally:
        await conn.close()
