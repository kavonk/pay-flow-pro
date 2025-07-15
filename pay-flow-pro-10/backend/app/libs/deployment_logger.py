from datetime import datetime
from typing import Optional
import asyncpg
import databutton as db
from app.env import mode, Mode
import uuid

class DeploymentLogger:
    """Utility class for logging deployment events to the database."""
    
    def __init__(self, deployment_id: Optional[str] = None, commit_sha: Optional[str] = None, branch_name: Optional[str] = None):
        self.deployment_id = deployment_id or str(uuid.uuid4())
        self.commit_sha = commit_sha
        self.branch_name = branch_name or "main"
    
    async def get_db_connection(self):
        database_url = (
            db.secrets.get("DATABASE_URL_DEV")
            if mode == Mode.DEV
            else db.secrets.get("DATABASE_URL_PROD")
        )
        return await asyncpg.connect(database_url)
    
    async def log(self, step: str, message: str, level: str = "INFO"):
        """Log a deployment event to the database.
        
        Args:
            step: The deployment step (e.g., 'npm_install', 'build', 'migration')
            message: Detailed message about what happened
            level: Log level (INFO, WARN, ERROR, FATAL)
        """
        conn = await self.get_db_connection()
        
        try:
            await conn.execute(
                """
                INSERT INTO deployment_logs (step, message, level, commit_sha, branch_name, deployment_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                step, message, level, self.commit_sha, self.branch_name, self.deployment_id
            )
            
            # Also print to console for immediate visibility
            timestamp = datetime.now().isoformat()
            print(f"[{timestamp}] [{level}] [{step}] {message}")
            
        except Exception as e:
            # If logging fails, at least print to console
            print(f"[ERROR] Failed to log deployment event: {e}")
            print(f"[{level}] [{step}] {message}")
        finally:
            await conn.close()
    
    async def log_info(self, step: str, message: str):
        """Log an info level deployment event."""
        await self.log(step, message, "INFO")
    
    async def log_warn(self, step: str, message: str):
        """Log a warning level deployment event."""
        await self.log(step, message, "WARN")
    
    async def log_error(self, step: str, message: str):
        """Log an error level deployment event."""
        await self.log(step, message, "ERROR")
    
    async def log_fatal(self, step: str, message: str):
        """Log a fatal error deployment event."""
        await self.log(step, message, "FATAL")
    
    async def log_deployment_start(self):
        """Log the start of a deployment."""
        await self.log_info("deployment_start", f"Deployment {self.deployment_id} started for commit {self.commit_sha} on branch {self.branch_name}")
    
    async def log_deployment_success(self):
        """Log successful deployment completion."""
        await self.log_info("deployment_complete", f"Deployment {self.deployment_id} completed successfully")
    
    async def log_deployment_failure(self, error_message: str):
        """Log deployment failure."""
        await self.log_fatal("deployment_failed", f"Deployment {self.deployment_id} failed: {error_message}")
    
    async def log_step_start(self, step: str, description: str):
        """Log the start of a deployment step."""
        await self.log_info(f"{step}_start", f"Starting {description}")
    
    async def log_step_success(self, step: str, description: str, duration: Optional[float] = None):
        """Log successful completion of a deployment step."""
        duration_str = f" (took {duration:.2f}s)" if duration else ""
        await self.log_info(f"{step}_complete", f"Completed {description}{duration_str}")
    
    async def log_step_failure(self, step: str, description: str, error: str):
        """Log failure of a deployment step."""
        await self.log_error(f"{step}_failed", f"Failed {description}: {error}")
