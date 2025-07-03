from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.libs.subscription_plans import PLANS
from app.libs.models import UserSubscription


router = APIRouter()

# Request/Response Models
class PublicSubscriptionPlanResponse(BaseModel):
    id: str  # Use slug for the ID
    name: str
    description: Optional[str] = None
    price_monthly: int
    invoice_limit: int
    team_member_limit: int
    dunning_rules_limit: int
    features: dict
    stripe_price_id_monthly: str
    stripe_price_id_yearly: str
    slug: str

class StartTrialRequest(BaseModel):
    plan_slug: str = Field(..., description="The slug of the plan to start a trial for.")

class UserSubscriptionResponse(BaseModel):
    id: UUID
    user_id: str
    status: str
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    plan: Optional[PublicSubscriptionPlanResponse] = None


@router.get("/public/plans", response_model=List[PublicSubscriptionPlanResponse])
async def get_public_subscription_plans() -> List[PublicSubscriptionPlanResponse]:
    """Get all available subscription plans directly from the PLANS constant."""
    plan_responses = []
    for slug, plan_data in PLANS.items():
        response_data = {
            "id": slug,
            "slug": slug,
            "name": plan_data["name"],
            "description": plan_data.get("description", f"The {plan_data['name']} plan."),
            "price_monthly": plan_data["price_monthly"],
            "invoice_limit": plan_data["invoice_limit"],
            "team_member_limit": plan_data["team_member_limit"],
            "dunning_rules_limit": plan_data["dunning_rules_limit"],
            "features": plan_data["features"],
            "stripe_price_id_monthly": plan_data["stripe_price_id_monthly"],
            "stripe_price_id_yearly": plan_data["stripe_price_id_yearly"],
        }
        plan_responses.append(PublicSubscriptionPlanResponse(**response_data))
    
    return plan_responses



