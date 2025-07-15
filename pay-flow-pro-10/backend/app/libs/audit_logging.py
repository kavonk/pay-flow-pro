from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4
from enum import Enum
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
import json
import asyncpg
import databutton as db
from app.env import Mode, mode


class AuditAction(str, Enum):
    """Enumeration of all possible audit actions."""
    # CRUD Operations
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    
    # Authentication
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PASSWORD_RESET = "PASSWORD_RESET"
    
    # Team Management
    INVITE_USER = "INVITE_USER"
    ACCEPT_INVITATION = "ACCEPT_INVITATION"
    REVOKE_INVITATION = "REVOKE_INVITATION"
    UPDATE_USER_ROLE = "UPDATE_USER_ROLE"
    REMOVE_USER = "REMOVE_USER"
    
    # Invoice Lifecycle
    SEND_INVOICE = "SEND_INVOICE"
    MARK_PAID = "MARK_PAID"
    CANCEL_INVOICE = "CANCEL_INVOICE"
    
    # Payment Processing
    PROCESS_PAYMENT = "PROCESS_PAYMENT"
    REFUND_PAYMENT = "REFUND_PAYMENT"
    
    # Data Export
    EXPORT_DATA = "EXPORT_DATA"
    
    # Settings
    UPDATE_SETTINGS = "UPDATE_SETTINGS"
    UPDATE_BRANDING = "UPDATE_BRANDING"


class ResourceType(str, Enum):
    """Enumeration of all resource types that can be audited."""
    CUSTOMER = "customer"
    INVOICE = "invoice"
    PAYMENT = "payment"
    USER = "user"
    TEAM = "team"
    INVITATION = "invitation"
    SETTINGS = "settings"
    EXPORT = "export"
    DUNNING_RULE = "dunning_rule"
    SUBSCRIPTION = "subscription"


class AuditStatus(str, Enum):
    """Status of the audited action."""
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"


@dataclass
class AuditLogEntry:
    """Represents a single audit log entry."""
    user_id: str
    account_id: UUID
    action: AuditAction
    resource_type: ResourceType
    resource_id: Optional[UUID] = None
    resource_identifier: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: AuditStatus = AuditStatus.SUCCESS
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    id: UUID = field(default_factory=uuid4)


class AuditLogger:
    """Service for logging audit events with performance optimization."""
    
    def __init__(self):
        self._connection_pool = None
        self._enabled = True  # Can be disabled for testing or performance
    
    async def _get_connection_pool(self):
        """Get or create database connection pool."""
        if self._connection_pool is None:
            if mode == Mode.PROD:
                database_url = db.secrets.get("DATABASE_URL_PROD")
            else:
                database_url = db.secrets.get("DATABASE_URL_DEV")
            
            self._connection_pool = await asyncpg.create_pool(
                database_url,
                min_size=1,
                max_size=5,
                command_timeout=10
            )
        return self._connection_pool
    
    @asynccontextmanager
    async def _get_connection(self):
        """Get a database connection from the pool."""
        pool = await self._get_connection_pool()
        async with pool.acquire() as connection:
            yield connection
    
    async def log(self, entry: AuditLogEntry) -> bool:
        """Log a single audit entry."""
        if not self._enabled:
            return True
            
        try:
            async with self._get_connection() as conn:
                await conn.execute(
                    """
                    INSERT INTO audit_logs (
                        id, user_id, account_id, action, resource_type, 
                        resource_id, resource_identifier, changes, metadata, 
                        status, error_message, timestamp, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    """,
                    entry.id,
                    entry.user_id,
                    entry.account_id,
                    entry.action.value,
                    entry.resource_type.value,
                    entry.resource_id,
                    entry.resource_identifier,
                    json.dumps(entry.changes) if entry.changes else None,
                    json.dumps(entry.metadata) if entry.metadata else None,
                    entry.status.value,
                    entry.error_message,
                    entry.timestamp,
                    entry.timestamp
                )
            return True
        except Exception as e:
            # Log the error but don't fail the main operation
            print(f"Audit logging failed: {str(e)}")
            return False
    
    async def log_crud_operation(
        self,
        user_id: str,
        account_id: UUID,
        action: AuditAction,
        resource_type: ResourceType,
        resource_id: Optional[UUID] = None,
        resource_identifier: Optional[str] = None,
        before_data: Optional[Dict[str, Any]] = None,
        after_data: Optional[Dict[str, Any]] = None,
        request_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Convenience method for logging CRUD operations."""
        changes = {}
        
        if action == AuditAction.CREATE and request_data:
            changes = {"created": request_data}
        elif action == AuditAction.UPDATE and before_data and after_data:
            changes = {"before": before_data, "after": after_data}
        elif action == AuditAction.DELETE and before_data:
            changes = {"deleted": before_data}
        elif request_data:
            changes = {"data": request_data}
        
        entry = AuditLogEntry(
            user_id=user_id,
            account_id=account_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_identifier=resource_identifier,
            changes=changes,
            metadata=metadata
        )
        
        return await self.log(entry)
    
    async def log_auth_event(
        self,
        user_id: str,
        account_id: UUID,
        action: AuditAction,
        success: bool = True,
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Convenience method for logging authentication events."""
        entry = AuditLogEntry(
            user_id=user_id,
            account_id=account_id,
            action=action,
            resource_type=ResourceType.USER,
            status=AuditStatus.SUCCESS if success else AuditStatus.FAILED,
            error_message=error_message,
            metadata=metadata
        )
        
        return await self.log(entry)
    
    async def get_audit_logs(
        self,
        account_id: UUID,
        user_id: Optional[str] = None,
        resource_type: Optional[ResourceType] = None,
        resource_id: Optional[UUID] = None,
        action: Optional[AuditAction] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Query audit logs with filtering."""
        conditions = ["account_id = $1"]
        params = [account_id]
        param_count = 1
        
        if user_id:
            param_count += 1
            conditions.append(f"user_id = ${param_count}")
            params.append(user_id)
        
        if resource_type:
            param_count += 1
            conditions.append(f"resource_type = ${param_count}")
            params.append(resource_type.value)
        
        if resource_id:
            param_count += 1
            conditions.append(f"resource_id = ${param_count}")
            params.append(resource_id)
        
        if action:
            param_count += 1
            conditions.append(f"action = ${param_count}")
            params.append(action.value)
        
        if start_date:
            param_count += 1
            conditions.append(f"timestamp >= ${param_count}")
            params.append(start_date)
        
        if end_date:
            param_count += 1
            conditions.append(f"timestamp <= ${param_count}")
            params.append(end_date)
        
        query = f"""
            SELECT 
                id, user_id, account_id, action, resource_type,
                resource_id, resource_identifier, changes, metadata,
                status, error_message, timestamp, created_at
            FROM audit_logs
            WHERE {' AND '.join(conditions)}
            ORDER BY timestamp DESC
            LIMIT ${param_count + 1} OFFSET ${param_count + 2}
        """
        params.extend([limit, offset])
        
        try:
            async with self._get_connection() as conn:
                rows = await conn.fetch(query, *params)
                return [
                    {
                        "id": str(row["id"]),
                        "user_id": row["user_id"],
                        "account_id": str(row["account_id"]),
                        "action": row["action"],
                        "resource_type": row["resource_type"],
                        "resource_id": str(row["resource_id"]) if row["resource_id"] else None,
                        "resource_identifier": row["resource_identifier"],
                        "changes": json.loads(row["changes"]) if row["changes"] else None,
                        "metadata": json.loads(row["metadata"]) if row["metadata"] else None,
                        "status": row["status"],
                        "error_message": row["error_message"],
                        "timestamp": row["timestamp"].isoformat(),
                        "created_at": row["created_at"].isoformat()
                    }
                    for row in rows
                ]
        except Exception as e:
            print(f"Failed to query audit logs: {str(e)}")
            return []
    
    def disable(self):
        """Disable audit logging (for testing)."""
        self._enabled = False
    
    def enable(self):
        """Enable audit logging."""
        self._enabled = True


# Global audit logger instance
audit_logger = AuditLogger()
