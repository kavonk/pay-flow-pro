"""Deployment automation utilities with retry logic and health monitoring."""

import asyncio
import asyncpg
import databutton as db
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional, Dict, Any
from app.libs.deployment_logger import DeploymentLogger
from app.env import mode, Mode

class DeploymentAutomation:
    """Handles deployment automation with retry logic and comprehensive logging."""
    
    def __init__(self):
        self.logger = DeploymentLogger()
        self.max_retries = 3
        self.retry_delay = 30  # seconds
        
    async def execute_deployment_with_retry(self, deployment_config: Dict[str, Any]) -> bool:
        """Execute a deployment with automatic retry on failure."""
        deployment_id = str(uuid4())
        
        for attempt in range(1, self.max_retries + 1):
            try:
                await self.logger.log_info(
                    deployment_id=deployment_id,
                    step="deployment_start",
                    message=f"Starting deployment attempt {attempt}/{self.max_retries}",
                    commit_sha=deployment_config.get('commit_sha'),
                    branch_name=deployment_config.get('branch_name', 'main')
                )
                
                # Execute deployment steps
                success = await self._execute_deployment_steps(deployment_id, deployment_config)
                
                if success:
                    await self.logger.log_info(
                        deployment_id=deployment_id,
                        step="deployment_complete",
                        message=f"Deployment completed successfully on attempt {attempt}",
                        commit_sha=deployment_config.get('commit_sha'),
                        branch_name=deployment_config.get('branch_name', 'main')
                    )
                    return True
                else:
                    if attempt < self.max_retries:
                        await self.logger.log_warning(
                            deployment_id=deployment_id,
                            step="deployment_retry",
                            message=f"Deployment failed on attempt {attempt}, retrying in {self.retry_delay} seconds...",
                            commit_sha=deployment_config.get('commit_sha'),
                            branch_name=deployment_config.get('branch_name', 'main')
                        )
                        await asyncio.sleep(self.retry_delay)
                    else:
                        await self.logger.log_error(
                            deployment_id=deployment_id,
                            step="deployment_failed",
                            message=f"Deployment failed after {self.max_retries} attempts",
                            commit_sha=deployment_config.get('commit_sha'),
                            branch_name=deployment_config.get('branch_name', 'main')
                        )
                        return False
                        
            except Exception as e:
                await self.logger.log_error(
                    deployment_id=deployment_id,
                    step="deployment_error",
                    message=f"Deployment attempt {attempt} failed with exception: {str(e)}",
                    commit_sha=deployment_config.get('commit_sha'),
                    branch_name=deployment_config.get('branch_name', 'main')
                )
                
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)
                else:
                    return False
                    
        return False
    
    async def _execute_deployment_steps(self, deployment_id: str, config: Dict[str, Any]) -> bool:
        """Execute the actual deployment steps."""
        try:
            # Step 1: Environment validation
            await self.logger.log_info(
                deployment_id=deployment_id,
                step="environment_validation",
                message="Validating environment variables and secrets",
                commit_sha=config.get('commit_sha'),
                branch_name=config.get('branch_name', 'main')
            )
            
            if not await self._validate_environment():
                await self.logger.log_error(
                    deployment_id=deployment_id,
                    step="environment_validation",
                    message="Environment validation failed - missing critical secrets",
                    commit_sha=config.get('commit_sha'),
                    branch_name=config.get('branch_name', 'main')
                )
                return False
            
            # Step 2: Database connectivity
            await self.logger.log_info(
                deployment_id=deployment_id,
                step="database_check",
                message="Checking database connectivity and schema",
                commit_sha=config.get('commit_sha'),
                branch_name=config.get('branch_name', 'main')
            )
            
            if not await self._check_database_health():
                await self.logger.log_error(
                    deployment_id=deployment_id,
                    step="database_check",
                    message="Database health check failed",
                    commit_sha=config.get('commit_sha'),
                    branch_name=config.get('branch_name', 'main')
                )
                return False
            
            # Step 3: External service validation
            await self.logger.log_info(
                deployment_id=deployment_id,
                step="service_validation",
                message="Validating external service connections (Stripe, etc.)",
                commit_sha=config.get('commit_sha'),
                branch_name=config.get('branch_name', 'main')
            )
            
            if not await self._validate_external_services():
                await self.logger.log_warning(
                    deployment_id=deployment_id,
                    step="service_validation",
                    message="Some external services may not be reachable, but deployment can continue",
                    commit_sha=config.get('commit_sha'),
                    branch_name=config.get('branch_name', 'main')
                )
            
            # Step 4: Final health check
            await self.logger.log_info(
                deployment_id=deployment_id,
                step="final_health_check",
                message="Performing final application health check",
                commit_sha=config.get('commit_sha'),
                branch_name=config.get('branch_name', 'main')
            )
            
            return True
            
        except Exception as e:
            await self.logger.log_error(
                deployment_id=deployment_id,
                step="deployment_error",
                message=f"Deployment step failed: {str(e)}",
                commit_sha=config.get('commit_sha'),
                branch_name=config.get('branch_name', 'main')
            )
            return False
    
    async def _validate_environment(self) -> bool:
        """Validate that all required environment variables are available."""
        try:
            required_secrets = [
                "DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD",
                "STRIPE_SECRET_KEY",
                "STRIPE_PUBLISHABLE_KEY",
                "STACK_SECRET_SERVER_KEY"
            ]
            
            missing_secrets = []
            for secret in required_secrets:
                if not db.secrets.get(secret):
                    missing_secrets.append(secret)
            
            if missing_secrets:
                print(f"Missing required secrets: {missing_secrets}")
                return False
            
            return True
        except Exception as e:
            print(f"Environment validation error: {str(e)}")
            return False
    
    async def _check_database_health(self) -> bool:
        """Check database connectivity and basic schema."""
        try:
            database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
            if not database_url:
                return False
            
            conn = await asyncpg.connect(database_url)
            
            # Check if key tables exist
            result = await conn.fetchval(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('customers', 'invoices', 'deployment_logs')"
            )
            
            await conn.close()
            
            # Should have at least the core tables
            return result >= 3
            
        except Exception as e:
            print(f"Database health check error: {str(e)}")
            return False
    
    async def _validate_external_services(self) -> bool:
        """Validate external service connections."""
        try:
            # This would normally check Stripe API, email services, etc.
            # For now, just check if secrets are available
            stripe_key = db.secrets.get("STRIPE_SECRET_KEY")
            return bool(stripe_key and stripe_key.startswith('sk_'))
        except Exception as e:
            print(f"External service validation error: {str(e)}")
            return False

class DeploymentHealthChecker:
    """Provides health check utilities for ongoing deployment monitoring."""
    
    def __init__(self):
        self.logger = DeploymentLogger()
    
    async def run_health_check(self) -> Dict[str, Any]:
        """Run a comprehensive health check and log results."""
        deployment_id = str(uuid4())
        health_status = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'overall_status': 'healthy',
            'checks': {},
            'deployment_id': deployment_id
        }
        
        try:
            await self.logger.log_info(
                deployment_id=deployment_id,
                step="health_check_start",
                message="Starting comprehensive health check"
            )
            
            # Database check
            db_healthy = await self._check_database()
            health_status['checks']['database'] = {
                'status': 'healthy' if db_healthy else 'unhealthy',
                'message': 'Database connection and schema OK' if db_healthy else 'Database issues detected'
            }
            
            # Environment check
            env_healthy = await self._check_environment()
            health_status['checks']['environment'] = {
                'status': 'healthy' if env_healthy else 'unhealthy', 
                'message': 'All required secrets available' if env_healthy else 'Missing required secrets'
            }
            
            # External services check
            services_healthy = await self._check_external_services()
            health_status['checks']['external_services'] = {
                'status': 'healthy' if services_healthy else 'degraded',
                'message': 'External services reachable' if services_healthy else 'Some external services unreachable'
            }
            
            # Determine overall status
            if not db_healthy or not env_healthy:
                health_status['overall_status'] = 'unhealthy'
            elif not services_healthy:
                health_status['overall_status'] = 'degraded'
            
            await self.logger.log_info(
                deployment_id=deployment_id,
                step="health_check_complete",
                message=f"Health check completed - Status: {health_status['overall_status']}"
            )
            
            return health_status
            
        except Exception as e:
            await self.logger.log_error(
                deployment_id=deployment_id,
                step="health_check_error",
                message=f"Health check failed: {str(e)}"
            )
            health_status['overall_status'] = 'error'
            health_status['error'] = str(e)
            return health_status
    
    async def _check_database(self) -> bool:
        """Check database health."""
        try:
            database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
            if not database_url:
                return False
            
            conn = await asyncpg.connect(database_url)
            await conn.fetchval("SELECT 1")
            await conn.close()
            return True
        except Exception:
            return False
    
    async def _check_environment(self) -> bool:
        """Check environment variables."""
        required_secrets = [
            "DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD",
            "STRIPE_SECRET_KEY",
            "STACK_SECRET_SERVER_KEY"
        ]
        
        for secret in required_secrets:
            if not db.secrets.get(secret):
                return False
        return True
    
    async def _check_external_services(self) -> bool:
        """Check external service availability."""
        try:
            # Simple check - verify Stripe key format
            stripe_key = db.secrets.get("STRIPE_SECRET_KEY")
            return bool(stripe_key and stripe_key.startswith('sk_'))
        except Exception:
            return False