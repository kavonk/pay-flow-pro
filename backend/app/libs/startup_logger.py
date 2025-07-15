import asyncio
import time
from typing import Optional, Callable, Any
from contextlib import asynccontextmanager
from deployment_logger import DeploymentLogger
from env_validator import env_validator

class StartupLogger:
    """Enhanced logging for application startup with deployment tracking."""
    
    def __init__(self):
        self.deployment_logger: Optional[DeploymentLogger] = None
        self.startup_errors: list = []
        self.startup_warnings: list = []
    
    async def initialize_deployment_logging(self, commit_sha: Optional[str] = None, branch_name: Optional[str] = None):
        """Initialize deployment logging for this startup."""
        try:
            self.deployment_logger = DeploymentLogger(
                commit_sha=commit_sha,
                branch_name=branch_name
            )
            await self.deployment_logger.log_deployment_start()
            print(f"[STARTUP] Deployment logging initialized: {self.deployment_logger.deployment_id}")
        except Exception as e:
            print(f"[STARTUP] Warning: Could not initialize deployment logging: {e}")
    
    async def validate_environment(self) -> bool:
        """Validate environment variables and log results."""
        print("[STARTUP] Validating environment variables...")
        
        try:
            results = env_validator.validate_all()
            
            if self.deployment_logger:
                await self.deployment_logger.log_step_start("env_validation", "environment variable validation")
            
            # Log detailed results
            summary = env_validator.get_validation_summary()
            print(summary)
            
            if results['success']:
                if self.deployment_logger:
                    await self.deployment_logger.log_step_success(
                        "env_validation", 
                        f"environment validation - {len(results['validated_secrets'])} secrets validated"
                    )
                return True
            else:
                # Log errors
                error_msg = f"Environment validation failed: {'; '.join(results['errors'])}"
                self.startup_errors.extend(results['errors'])
                self.startup_warnings.extend(results['warnings'])
                
                if self.deployment_logger:
                    await self.deployment_logger.log_step_failure("env_validation", "environment validation", error_msg)
                
                print(f"[STARTUP] ERROR: {error_msg}")
                return False
                
        except Exception as e:
            error_msg = f"Environment validation crashed: {str(e)}"
            self.startup_errors.append(error_msg)
            
            if self.deployment_logger:
                await self.deployment_logger.log_step_failure("env_validation", "environment validation", error_msg)
            
            print(f"[STARTUP] FATAL: {error_msg}")
            return False
    
    @asynccontextmanager
    async def log_startup_step(self, step_name: str, description: str):
        """Context manager for logging startup steps with timing."""
        start_time = time.time()
        
        try:
            print(f"[STARTUP] Starting {description}...")
            
            if self.deployment_logger:
                await self.deployment_logger.log_step_start(step_name, description)
            
            yield
            
            duration = time.time() - start_time
            print(f"[STARTUP] ✅ Completed {description} in {duration:.2f}s")
            
            if self.deployment_logger:
                await self.deployment_logger.log_step_success(step_name, description, duration)
                
        except Exception as e:
            duration = time.time() - start_time
            error_msg = str(e)
            
            print(f"[STARTUP] ❌ Failed {description} after {duration:.2f}s: {error_msg}")
            self.startup_errors.append(f"{description}: {error_msg}")
            
            if self.deployment_logger:
                await self.deployment_logger.log_step_failure(step_name, description, error_msg)
            
            raise
    
    async def test_database_connection(self) -> bool:
        """Test database connectivity."""
        async with self.log_startup_step("db_connection", "database connection test"):
            try:
                import asyncpg
                import databutton as db
                from app.env import mode, Mode
                
                database_url = (
                    db.secrets.get("DATABASE_URL_DEV")
                    if mode == Mode.DEV
                    else db.secrets.get("DATABASE_URL_PROD")
                )
                
                if not database_url:
                    raise Exception("Database URL not found in secrets")
                
                conn = await asyncpg.connect(database_url)
                result = await conn.fetchrow("SELECT 1 as test")
                await conn.close()
                
                if result and result['test'] == 1:
                    print("[STARTUP] Database connection successful")
                    return True
                else:
                    raise Exception("Database query returned unexpected result")
                    
            except Exception as e:
                print(f"[STARTUP] Database connection failed: {e}")
                raise
    
    async def run_startup_sequence(self, commit_sha: Optional[str] = None, branch_name: Optional[str] = None) -> bool:
        """Run the complete startup sequence with logging."""
        try:
            # Initialize deployment logging
            await self.initialize_deployment_logging(commit_sha, branch_name)
            
            # Validate environment
            if not await self.validate_environment():
                await self.log_startup_failure("Environment validation failed")
                return False
            
            # Test database connection
            if not await self.test_database_connection():
                await self.log_startup_failure("Database connection failed")
                return False
            
            # Log successful startup
            await self.log_startup_success()
            return True
            
        except Exception as e:
            await self.log_startup_failure(f"Startup sequence crashed: {str(e)}")
            return False
    
    async def log_startup_success(self):
        """Log successful application startup."""
        print("[STARTUP] ✅ Application startup completed successfully")
        
        if self.deployment_logger:
            await self.deployment_logger.log_deployment_success()
    
    async def log_startup_failure(self, error_message: str):
        """Log startup failure."""
        full_error = f"Startup failed: {error_message}"
        if self.startup_errors:
            full_error += f" | Previous errors: {'; '.join(self.startup_errors)}"
        
        print(f"[STARTUP] ❌ {full_error}")
        
        if self.deployment_logger:
            await self.deployment_logger.log_deployment_failure(full_error)

# Global instance
startup_logger = StartupLogger()
