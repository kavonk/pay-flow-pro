from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import databutton as db

router = APIRouter()

class StripeConfigResponse(BaseModel):
    """Response model for Stripe configuration."""
    publishable_key: str

@router.get("/stripe", response_model=StripeConfigResponse)
async def get_stripe_config() -> StripeConfigResponse:
    """Get Stripe configuration for frontend. Public endpoint for signup flow."""
    publishable_key = db.secrets.get("STRIPE_PUBLISHABLE_KEY")
    if not publishable_key:
        raise HTTPException(status_code=500, detail="Stripe publishable key not configured")
    
    return StripeConfigResponse(publishable_key=publishable_key)
