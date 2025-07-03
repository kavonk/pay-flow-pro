from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from app.auth import AuthorizedUser
from app.libs.fee_calculator import get_plan_fee_info, PLAN_MARKUPS, STRIPE_PERCENTAGE_FEE, STRIPE_FIXED_FEE

router = APIRouter(prefix="/settings")

# Pydantic models
class FeeStructureInfo(BaseModel):
    plan_slug: str
    plan_name: str
    stripe_base_fee: str
    our_markup_percentage: str
    total_rate: str
    example_fee_on_100: str

class TransactionFeeSettings(BaseModel):
    stripe_percentage: str
    stripe_fixed_fee: str
    fee_structure: List[FeeStructureInfo]
    current_plan_info: FeeStructureInfo

class CronSetupInstructions(BaseModel):
    monthly_billing_url: str
    dunning_reminders_url: str
    trial_conversion_url: str
    cron_schedule_monthly: str
    cron_schedule_daily: str
    required_headers: Dict[str, str]
    setup_instructions: List[str]

@router.get("/fee-structure", response_model=TransactionFeeSettings)
async def get_fee_structure(user: AuthorizedUser):
    """Get transaction fee structure information for the settings page."""
    
    # Define plan display names
    plan_names = {
        'free': 'Free',
        'starter': 'Starter',
        'pro': 'Professional', 
        'business': 'Business',
        'enterprise': 'Enterprise'
    }
    
    # Get fee structure for all plans
    fee_structure = []
    for plan_slug, plan_name in plan_names.items():
        fee_info = get_plan_fee_info(plan_slug)
        markup_percentage = PLAN_MARKUPS.get(plan_slug, PLAN_MARKUPS['free'])
        
        fee_structure.append(FeeStructureInfo(
            plan_slug=plan_slug,
            plan_name=plan_name,
            stripe_base_fee=fee_info['stripe_base'],
            our_markup_percentage=f"{markup_percentage * 100}%",
            total_rate=fee_info['total_rate'],
            example_fee_on_100=fee_info['example_100']
        ))
    
    # Get current user's plan info (defaulting to 'free' for now)
    # In a real implementation, you'd fetch this from the database
    current_plan_slug = 'free'  # This should come from user's subscription
    current_plan_info = next(
        (info for info in fee_structure if info.plan_slug == current_plan_slug),
        fee_structure[0]
    )
    
    return TransactionFeeSettings(
        stripe_percentage=f"{STRIPE_PERCENTAGE_FEE * 100}%",
        stripe_fixed_fee=f"€{STRIPE_FIXED_FEE}",
        fee_structure=fee_structure,
        current_plan_info=current_plan_info
    )

@router.get("/cron-setup", response_model=CronSetupInstructions)
async def get_billing_cron_setup_instructions():
    """Get cron job setup instructions for automated billing."""
    
    # These URLs would be your actual production URLs
    base_url = "https://api.databutton.com/_projects/your-project-id/dbtn/prodx/app/routes"
    
    return CronSetupInstructions(
        monthly_billing_url=f"{base_url}/billing-automation/run-monthly-billing",
        dunning_reminders_url=f"{base_url}/cron/run-dunning-job",
        trial_conversion_url=f"{base_url}/cron/run-trial-conversion-job",
        cron_schedule_monthly="0 2 1 * *",  # 2 AM on the 1st of every month
        cron_schedule_daily="0 9 * * *",    # 9 AM every day
        required_headers={
            "Authorization": "Bearer YOUR_SCHEDULER_SECRET_KEY",
            "Content-Type": "application/json"
        },
        setup_instructions=[
            "1. Set up a cron job or scheduled task on your server",
            "2. Configure the monthly billing job to run on the 1st of each month at 2 AM",
            "3. Configure daily jobs for dunning reminders and trial conversions",
            "4. Include the Authorization header with your scheduler secret key",
            "5. Monitor the job health endpoints to ensure successful execution",
            "6. Set up alerting for failed job executions"
        ]
    )