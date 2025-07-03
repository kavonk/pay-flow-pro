from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict

from app.libs.subscription_plans import PLANS

router = APIRouter(prefix="/public", tags=["Public Data"])

class PublicPlanResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: Optional[float] = None
    features: Dict
    invoice_limit: int
    team_member_limit: int
    dunning_rules_limit: int

@router.get("/plans", response_model=List[PublicPlanResponse])
async def get_public_subscription_plans() -> List[PublicPlanResponse]:
    """
    Get all available subscription plans with full feature details.
    This endpoint is public and does not require authentication.
    """
    plan_responses = []
    for slug, data in PLANS.items():
        yearly_price = data.get("price_yearly")
        if yearly_price is None and data.get("price_monthly") is not None:
            # Approx. 17% discount, which is about 2 months free
            yearly_price = data["price_monthly"] * 10
            
        plan_responses.append(
            PublicPlanResponse(
                id=slug,
                slug=slug,
                name=data["name"],
                description=data.get("description"),
                price_monthly=data["price_monthly"],
                price_yearly=yearly_price,
                features=data.get("features", {}),
                invoice_limit=data.get("invoice_limit", 0),
                team_member_limit=data.get("team_member_limit", 0),
                dunning_rules_limit=data.get("dunning_rules_limit", 0),
            )
        )
    return plan_responses
