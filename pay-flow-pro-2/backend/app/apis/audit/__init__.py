from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.auth import AuthorizedUser
from app.libs.audit_logging import audit_logger, AuditAction, ResourceType
from app.libs.repository import PaymentRepository

router = APIRouter(prefix="/audit")

# Request/Response models
class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    account_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    resource_identifier: Optional[str] = None
    changes: Optional[dict] = None
    metadata: Optional[dict] = None
    status: str
    error_message: Optional[str] = None
    timestamp: str
    created_at: str

class AuditLogsListResponse(BaseModel):
    audit_logs: List[AuditLogResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    filters_applied: dict

class AuditLogStatsResponse(BaseModel):
    total_actions: int
    actions_by_type: dict
    actions_by_user: dict
    actions_by_resource: dict
    recent_activity_count: int
    failed_actions_count: int

@router.get("/logs", response_model=AuditLogsListResponse)
async def get_audit_logs(
    user: AuthorizedUser,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=500, description="Items per page"),
    user_filter: Optional[str] = Query(None, description="Filter by user ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by resource ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    status: Optional[str] = Query(None, description="Filter by status (SUCCESS, FAILED, PENDING)")
):
    """Get audit logs with comprehensive filtering options."""
    try:
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        # Convert string enums back to enum types for filtering
        resource_type_enum = None
        if resource_type:
            try:
                resource_type_enum = ResourceType(resource_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid resource_type: {resource_type}")
        
        action_enum = None
        if action:
            try:
                action_enum = AuditAction(action)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
        
        resource_id_uuid = None
        if resource_id:
            try:
                resource_id_uuid = UUID(resource_id)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid resource_id format: {resource_id}")
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get audit logs with filters
        logs = await audit_logger.get_audit_logs(
            account_id=account_id,
            user_id=user_filter,
            resource_type=resource_type_enum,
            resource_id=resource_id_uuid,
            action=action_enum,
            start_date=start_date,
            end_date=end_date,
            limit=limit + 1,  # +1 to check if there's a next page
            offset=offset
        )
        
        # Check if there's a next page
        has_next = len(logs) > limit
        if has_next:
            logs = logs[:-1]  # Remove the extra item
        
        # Convert to response format
        audit_log_responses = [
            AuditLogResponse(**log) for log in logs
        ]
        
        # Build filters applied summary
        filters_applied = {
            "user_filter": user_filter,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "status": status
        }
        # Remove None values
        filters_applied = {k: v for k, v in filters_applied.items() if v is not None}
        
        return AuditLogsListResponse(
            audit_logs=audit_log_responses,
            total=len(audit_log_responses),
            page=page,
            limit=limit,
            has_next=has_next,
            filters_applied=filters_applied
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching audit logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch audit logs")

@router.get("/stats", response_model=AuditLogStatsResponse)
async def get_audit_stats(
    user: AuthorizedUser,
    start_date: Optional[datetime] = Query(None, description="Start date for stats"),
    end_date: Optional[datetime] = Query(None, description="End date for stats")
):
    """Get audit log statistics for dashboard and analytics."""
    try:
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        # Get all logs for the time period to calculate stats
        logs = await audit_logger.get_audit_logs(
            account_id=account_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000  # Large limit to get all data for stats
        )
        
        # Calculate statistics
        total_actions = len(logs)
        actions_by_type = {}
        actions_by_user = {}
        actions_by_resource = {}
        failed_actions_count = 0
        recent_activity_count = 0
        
        # Calculate cutoff for "recent" activity (last 24 hours)
        recent_cutoff = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for log in logs:
            # Count by action type
            action = log["action"]
            actions_by_type[action] = actions_by_type.get(action, 0) + 1
            
            # Count by user
            user_id = log["user_id"]
            actions_by_user[user_id] = actions_by_user.get(user_id, 0) + 1
            
            # Count by resource type
            resource_type = log["resource_type"]
            actions_by_resource[resource_type] = actions_by_resource.get(resource_type, 0) + 1
            
            # Count failed actions
            if log["status"] == "FAILED":
                failed_actions_count += 1
            
            # Count recent activity
            log_time = datetime.fromisoformat(log["timestamp"].replace('Z', '+00:00'))
            if log_time >= recent_cutoff:
                recent_activity_count += 1
        
        return AuditLogStatsResponse(
            total_actions=total_actions,
            actions_by_type=actions_by_type,
            actions_by_user=actions_by_user,
            actions_by_resource=actions_by_resource,
            recent_activity_count=recent_activity_count,
            failed_actions_count=failed_actions_count
        )
        
    except Exception as e:
        print(f"Error calculating audit stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate audit statistics")

@router.get("/actions", response_model=List[str])
async def get_available_actions(user: AuthorizedUser):
    """Get list of all available audit actions for filtering."""
    return [action.value for action in AuditAction]

@router.get("/resource-types", response_model=List[str])
async def get_available_resource_types(user: AuthorizedUser):
    """Get list of all available resource types for filtering."""
    return [resource_type.value for resource_type in ResourceType]

@router.get("/export", response_model=dict)
async def export_audit_logs(
    user: AuthorizedUser,
    format: str = Query("csv", description="Export format: csv or json"),
    user_filter: Optional[str] = Query(None, description="Filter by user ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering")
):
    """Export audit logs in CSV or JSON format."""
    try:
        if format not in ["csv", "json"]:
            raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")
        
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        # Convert string enums back to enum types for filtering
        resource_type_enum = None
        if resource_type:
            try:
                resource_type_enum = ResourceType(resource_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid resource_type: {resource_type}")
        
        action_enum = None
        if action:
            try:
                action_enum = AuditAction(action)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
        
        # Get all matching logs (no pagination for export)
        logs = await audit_logger.get_audit_logs(
            account_id=account_id,
            user_id=user_filter,
            resource_type=resource_type_enum,
            action=action_enum,
            start_date=start_date,
            end_date=end_date,
            limit=50000  # Large limit for export
        )
        
        if format == "csv":
            # Generate CSV content
            import csv
            import io
            
            output = io.StringIO()
            if logs:
                fieldnames = logs[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                
                for log in logs:
                    # Flatten complex fields for CSV
                    csv_row = log.copy()
                    if csv_row.get('changes'):
                        csv_row['changes'] = str(csv_row['changes'])
                    if csv_row.get('metadata'):
                        csv_row['metadata'] = str(csv_row['metadata'])
                    writer.writerow(csv_row)
            
            return {
                "format": "csv",
                "content": output.getvalue(),
                "filename": f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
                "count": len(logs)
            }
        
        else:  # JSON format
            import json
            return {
                "format": "json",
                "content": json.dumps(logs, indent=2),
                "filename": f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
                "count": len(logs)
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting audit logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export audit logs")
