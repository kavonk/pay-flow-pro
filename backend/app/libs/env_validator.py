from typing import List, Dict, Optional
import databutton as db
from app.env import mode, Mode

class EnvironmentValidator:
    """Validate required environment variables and secrets on startup."""
    
    # Define required secrets for different environments
    REQUIRED_SECRETS = {
        'common': [
            'STRIPE_SECRET_KEY',
            'STRIPE_PUBLISHABLE_KEY',
            'STACK_SECRET_SERVER_KEY',
            'SCHEDULER_SECRET_KEY'
        ],
        'dev': [
            'DATABASE_URL_DEV',
            'DATABASE_URL_ADMIN_DEV'
        ],
        'prod': [
            'DATABASE_URL_PROD', 
            'DATABASE_URL_ADMIN_PROD'
        ]
    }
    
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.validated_secrets: Dict[str, bool] = {}
    
    def validate_all(self) -> Dict[str, any]:
        """Validate all required environment variables and return results.
        
        Returns:
            Dict containing validation results with keys:
            - success: bool
            - errors: List[str]
            - warnings: List[str]
            - missing_secrets: List[str]
            - validated_secrets: Dict[str, bool]
        """
        self.errors.clear()
        self.warnings.clear()
        self.validated_secrets.clear()
        
        # Get environment-specific required secrets
        current_env = 'dev' if mode == Mode.DEV else 'prod'
        required_secrets = self.REQUIRED_SECRETS['common'] + self.REQUIRED_SECRETS[current_env]
        
        missing_secrets = []
        
        for secret_key in required_secrets:
            try:
                value = db.secrets.get(secret_key)
                
                if not value:
                    missing_secrets.append(secret_key)
                    self.validated_secrets[secret_key] = False
                    self.errors.append(f"Missing required secret: {secret_key}")
                elif len(value.strip()) == 0:
                    missing_secrets.append(secret_key)
                    self.validated_secrets[secret_key] = False
                    self.errors.append(f"Empty value for required secret: {secret_key}")
                else:
                    self.validated_secrets[secret_key] = True
                    
                    # Additional validation for specific secrets
                    if secret_key.startswith('DATABASE_URL'):
                        if not self._validate_database_url(value):
                            self.warnings.append(f"Database URL format may be invalid: {secret_key}")
                    elif secret_key.startswith('STRIPE_'):
                        if not self._validate_stripe_key(secret_key, value):
                            self.warnings.append(f"Stripe key format may be invalid: {secret_key}")
                            
            except Exception as e:
                missing_secrets.append(secret_key)
                self.validated_secrets[secret_key] = False
                self.errors.append(f"Error accessing secret {secret_key}: {str(e)}")
        
        # Additional environment-specific validations
        self._validate_environment_consistency()
        
        success = len(self.errors) == 0
        
        return {
            'success': success,
            'errors': self.errors,
            'warnings': self.warnings,
            'missing_secrets': missing_secrets,
            'validated_secrets': self.validated_secrets,
            'environment': current_env
        }
    
    def _validate_database_url(self, url: str) -> bool:
        """Basic validation of database URL format."""
        return url.startswith('postgresql://') or url.startswith('postgres://')
    
    def _validate_stripe_key(self, key_name: str, value: str) -> bool:
        """Basic validation of Stripe key format."""
        if key_name == 'STRIPE_SECRET_KEY':
            return value.startswith('sk_')
        elif key_name == 'STRIPE_PUBLISHABLE_KEY':
            return value.startswith('pk_')
        return True
    
    def _validate_environment_consistency(self):
        """Validate that environment configuration is consistent."""
        try:
            # Check if we're in the right environment
            current_env = 'dev' if mode == Mode.DEV else 'prod'
            
            # Verify database URLs match environment
            if current_env == 'dev':
                dev_url = db.secrets.get('DATABASE_URL_DEV')
                if dev_url and 'prod' in dev_url.lower():
                    self.warnings.append("Development environment may be using production database URL")
            else:
                prod_url = db.secrets.get('DATABASE_URL_PROD')
                if prod_url and 'dev' in prod_url.lower():
                    self.warnings.append("Production environment may be using development database URL")
                    
        except Exception as e:
            self.warnings.append(f"Could not validate environment consistency: {str(e)}")
    
    def get_validation_summary(self) -> str:
        """Get a human-readable summary of validation results."""
        results = self.validate_all()
        
        summary_lines = []
        summary_lines.append(f"Environment Validation Summary ({results['environment']} mode):")
        
        if results['success']:
            summary_lines.append("✅ All required secrets are present and valid")
        else:
            summary_lines.append(f"❌ Validation failed with {len(results['errors'])} error(s)")
            
        if results['errors']:
            summary_lines.append("\nErrors:")
            for error in results['errors']:
                summary_lines.append(f"  - {error}")
                
        if results['warnings']:
            summary_lines.append("\nWarnings:")
            for warning in results['warnings']:
                summary_lines.append(f"  - {warning}")
                
        summary_lines.append(f"\nSecrets validated: {len([k for k, v in results['validated_secrets'].items() if v])}/{len(results['validated_secrets'])}")
        
        return "\n".join(summary_lines)

# Global instance for easy access
env_validator = EnvironmentValidator()
