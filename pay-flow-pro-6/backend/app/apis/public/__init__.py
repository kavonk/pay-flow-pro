from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import databutton as db
from typing import Optional, Dict, Any
from uuid import UUID
from app.libs.repository import PaymentRepository
from app.libs.models import PayoutAccount, PayoutAccountStatus
from app.env import mode, Mode
import stripe
from uuid import uuid4
from datetime import datetime, timezone

# Initialize Stripe
stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")

# This API is intentionally unprotected for public access during signup
router = APIRouter(prefix="/public")

class StripeConfigResponse(BaseModel):
    """Response model for Stripe configuration."""
    publishable_key: str

class InvitationDetailsResponse(BaseModel):
    id: str
    email: str
    role: str
    expires_at: str
    is_expired: bool
    account_name: str

class AcceptInvitationPublicRequest(BaseModel):
    token: str
    email: str
    # Optional fields for account creation
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class CreateAccountLinkRequest(BaseModel):
    user_id: str
    email: Optional[str] = None
    country: str = "IE"
    business_type: str = "individual"

class AccountLinkResponse(BaseModel):
    account_link_url: str
    stripe_account_id: str
    expires_at: int  # Unix timestamp

@router.get("/stripe-config", response_model=StripeConfigResponse)
async def get_public_stripe_config() -> StripeConfigResponse:
    """Get Stripe publishable key for signup flow. Public endpoint."""
    publishable_key = db.secrets.get("STRIPE_PUBLISHABLE_KEY")
    if not publishable_key:
        raise HTTPException(status_code=500, detail="Stripe publishable key not configured")
    
    return StripeConfigResponse(publishable_key=publishable_key)

@router.get("/invitation/{token}")
async def get_invitation_details(token: str):
    """Get invitation details without authentication for display on acceptance page."""
    try:
        # Create a temporary repo instance - we'll need to modify this to not require user_id
        # For now, use a placeholder and modify repo method to handle invitation-only queries
        repo = PaymentRepository("system")  # Placeholder user_id
        
        invitation = await repo.get_invitation_by_token(token)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        # Get account details for display
        account_details = await repo.get_account_details(invitation.account_id)
        
        return InvitationDetailsResponse(
            id=str(invitation.id),
            email=invitation.email,
            role=invitation.role.value,
            expires_at=invitation.expires_at.isoformat(),
            is_expired=invitation.is_expired,
            account_name=account_details.get('name', 'Team') if account_details else 'Team'
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting invitation details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get invitation details")

@router.post("/accept-invitation")
async def accept_invitation_public(request: AcceptInvitationPublicRequest):
    """Accept invitation and create new account if needed (no auth required)."""
    try:
        # Create a temporary repo instance
        repo = PaymentRepository("system")
        
        # Get invitation details first
        invitation = await repo.get_invitation_by_token(request.token)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        if invitation.is_expired:
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Verify email matches invitation
        if invitation.email.lower() != request.email.lower():
            raise HTTPException(status_code=400, detail="Email does not match invitation")
        
        # For now, return success - the frontend handles account creation via Stack Auth
        # Once they create an account and are authenticated, they can use the protected accept_invitation endpoint
        return {
            "message": "Invitation validated successfully", 
            "email": invitation.email,
            "role": invitation.role.value,
            "account_name": "Team",  # We can enhance this later
            "redirect_url": f"/accept-invitation?token={request.token}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to accept invitation")

@router.post("/create-account-link", response_model=AccountLinkResponse)
async def create_account_link_public(request: CreateAccountLinkRequest):
    """
    Create account link for Stripe Express onboarding (Public endpoint - no auth required).
    
    This endpoint automatically creates a Stripe Express account if the user doesn't have one,
    then generates an account link for hosted onboarding. Designed for popup windows.
    """
    try:
        repo = PaymentRepository(request.user_id)
        
        # Check if user already has a payout account
        existing_account = await repo.get_payout_account()
        
        stripe_account_id = None
        if existing_account:
            stripe_account_id = existing_account['stripe_account_id']
            
            # If account is already active, return error
            if existing_account['status'] == PayoutAccountStatus.ACTIVE:
                raise HTTPException(
                    status_code=400, 
                    detail="Account is already active and onboarding is complete"
                )
        else:
            # Create new Stripe Express account
            stripe_account = stripe.Account.create(
                type="express",
                country=request.country,
                email=request.email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            
            stripe_account_id = stripe_account.id
            
            # Get account_id for multi-tenant support
            account_id = await repo._get_user_account_id()
            
            # Create payout account in database
            payout_account = PayoutAccount(
                id=uuid4(),
                user_id=request.user_id,
                account_id=account_id,
                stripe_account_id=stripe_account.id,
                account_status=PayoutAccountStatus.PENDING,
                business_type=request.business_type,
                country=request.country,
                email=request.email,
                requirements_currently_due=stripe_account.requirements.currently_due or [],
                requirements_past_due=stripe_account.requirements.past_due or [],
                charges_enabled=stripe_account.charges_enabled,
                payouts_enabled=stripe_account.payouts_enabled,
                details_submitted=stripe_account.details_submitted,
                capabilities=dict(stripe_account.capabilities) if stripe_account.capabilities else {},
            )
            
            await repo.create_payout_account(payout_account)
            print(f"Created new Express account for user {request.user_id}: {stripe_account.id}")
        
        # Create account link for onboarding - environment aware URLs
        if mode == Mode.PROD:
            base_url = "https://kavon.databutton.app/payflow-pro"
        else:
            base_url = "https://databutton.com/_projects/f263b849-f255-4941-b718-64221e5922dc/dbtn/devx/ui"
            
        # Create account link with popup-friendly URLs pointing to OnboardingComplete page
        account_link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=f"{base_url}/onboarding-complete?refresh=true&user_id={request.user_id}",
            return_url=f"{base_url}/onboarding-complete?success=true&user_id={request.user_id}",
            type="account_onboarding",
        )
        
        return AccountLinkResponse(
            account_link_url=account_link.url,
            stripe_account_id=stripe_account_id,
            expires_at=account_link.expires_at
        )
        
    except stripe.error.StripeError as e:
        error_msg = f"Stripe error: {str(e)}"
        print(f"Stripe error in create_account_link_public: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        error_msg = f"Internal error: {str(e)}"
        print(f"Unexpected error in create_account_link_public: {error_msg}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)
