from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.auth import AuthorizedUser
from app.libs.fee_calculator import calculate_fee_preview, get_plan_fee_info

router = APIRouter(prefix="/fees")

# Pydantic models
class FeePreviewRequest(BaseModel):
    payment_amount: float
    plan_slug: Optional[str] = None

class FeePreviewResponse(BaseModel):
    payment_amount: float
    stripe_fee: str
    our_markup_amount: str
    total_fee: str
    effective_rate: str
    markup_percentage: str
    plan_name: str

class PlanFeeInfoResponse(BaseModel):
    plan_slug: str
    stripe_base: str
    our_markup: str
    total_rate: str
    example_100: str

@router.post("/preview", response_model=FeePreviewResponse)
async def get_fee_preview(request: FeePreviewRequest, user: AuthorizedUser):
    """Get a preview of transaction fees for a given payment amount."""
    
    # Use provided plan or default to user's current plan
    plan_slug = request.plan_slug
    
    if not plan_slug:
        # In a real implementation, fetch user's current plan from database
        # For now, default to 'free'
        plan_slug = 'free'
    
    if request.payment_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")
        
    # Calculate fee preview
    preview = calculate_fee_preview(request.payment_amount, plan_slug)
    
    # Plan display names
    plan_names = {
        'free': 'Free',
        'starter': 'Starter', 
        'pro': 'Professional',
        'business': 'Business',
        'enterprise': 'Enterprise'
    }
    
    return FeePreviewResponse(
        payment_amount=request.payment_amount,
        stripe_fee=preview['stripe_fee'],
        our_markup_amount=preview['our_markup_amount'],
        total_fee=preview['total_fee'],
        effective_rate=preview['effective_rate'],
        markup_percentage=preview['markup_percentage'],
        plan_name=plan_names.get(plan_slug, 'Unknown')
    )

@router.get("/plan-info/{plan_slug}", response_model=PlanFeeInfoResponse)
async def get_plan_fee_info_endpoint(plan_slug: str):
    """Get fee information for a specific subscription plan."""
    
    valid_plans = ['free', 'starter', 'pro', 'business', 'enterprise']
    
    if plan_slug not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan slug. Must be one of: {valid_plans}")
    
    fee_info = get_plan_fee_info(plan_slug)
    
    return PlanFeeInfoResponse(
        plan_slug=plan_slug,
        stripe_base=fee_info['stripe_base'],
        our_markup=fee_info['our_markup'],
        total_rate=fee_info['total_rate'],
        example_100=fee_info['example_100']
    )

@router.get("/all-plans", response_model=list[PlanFeeInfoResponse])
async def get_all_plan_fee_info():
    """Get fee information for all subscription plans."""
    
    plans = ['free', 'starter', 'pro', 'business', 'enterprise']
    
    return [
        PlanFeeInfoResponse(
            plan_slug=plan_slug,
            **get_plan_fee_info(plan_slug)
        )
        for plan_slug in plans
    ]