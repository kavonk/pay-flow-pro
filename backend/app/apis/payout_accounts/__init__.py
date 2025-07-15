from typing import Optional, List, Dict
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import stripe
import databutton as db
from urllib.parse import urlparse, urlunparse
import re

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository, PayoutAccountStatus
from app.libs.models import PayoutAccount
from app.env import mode, Mode
import traceback

# Trigger reload to apply schema changes
router = APIRouter(prefix="/payout_accounts", tags=["Payout Accounts"])

# Initialize Stripe
stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")

def sanitize_business_url(url: Optional[str]) -> Optional[str]:
    """
    Sanitize business profile URL for Stripe compatibility.
    Removes query parameters, fragments, and ensures proper format.
    Returns None if URL is empty/None (business URL is optional).
    """
    if not url or not url.strip():
        return None

    # Add https:// if no scheme provided
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        parsed = urlparse(url)

        # Validate basic URL structure
        if not parsed.netloc:
            raise ValueError("Invalid URL format")

        # Remove query parameters and fragments that Stripe might reject
        clean_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path or '/',
            '',  # Remove params
            '',  # Remove query
            ''   # Remove fragment
        ))

        # Basic domain validation
        domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$'
        if not re.match(domain_pattern, parsed.netloc.split(':')[0]):
            raise ValueError("Invalid domain format")

        return clean_url

    except Exception as e:
        raise ValueError(f"Invalid URL format: {str(e)}")

# Request/Response Models
class Representative(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    address_line1: str
    address_city: str
    address_state: Optional[str] = None
    address_postal_code: str
    address_country: str
    dob_day: int
    dob_month: int
    dob_year: int

class BusinessProfile(BaseModel):
    name: str
    mcc: str  # Merchant Category Code
    url: Optional[str] = None
    product_description: str

class BankAccount(BaseModel):
    account_number: str
    routing_number: str  # For US, sort code for UK, etc.
    account_holder_name: str
    country: str
    currency: str

class ToSAcceptance(BaseModel):
    date: int  # Unix timestamp
    ip: str
    user_agent: Optional[str] = None

class CreatePayoutAccountRequest(BaseModel):
    business_type: str  # "individual" or "company"
    country: str = "IE"
    representative: Representative
    business_profile: BusinessProfile
    bank_account: BankAccount
    # tos_acceptance removed - Express accounts handle ToS via Stripe onboarding

# Legacy simple request for backwards compatibility
class CreateSimplePayoutAccountRequest(BaseModel):
    business_type: Optional[str] = "individual"
    country: str = "IE"
    email: Optional[str] = None

class PayoutAccountResponse(BaseModel):
    id: str
    stripe_account_id: str
    account_status: str
    business_type: Optional[str]
    country: str
    email: Optional[str]
    requirements_currently_due: list[str]
    requirements_past_due: list[str]
    charges_enabled: bool
    payouts_enabled: bool
    details_submitted: bool
    external_account_id: Optional[str]
    onboarding_url: Optional[str] = None
    dashboard_url: Optional[str] = None
    created_at: str
    updated_at: str

class AccountLinkResponse(BaseModel):
    url: str

def _payout_account_to_response(account: PayoutAccount, onboarding_url: Optional[str] = None, dashboard_url: Optional[str] = None) -> PayoutAccountResponse:
    """Convert PayoutAccount model to response."""
    return PayoutAccountResponse(
        id=str(account.id),
        stripe_account_id=account.stripe_account_id,
        account_status=account.account_status.value,
        business_type=account.business_type,
        country=account.country,
        email=account.email,
        requirements_currently_due=account.requirements_currently_due or [],
        requirements_past_due=account.requirements_past_due or [],
        charges_enabled=account.charges_enabled,
        payouts_enabled=account.payouts_enabled,
        details_submitted=account.details_submitted,
        external_account_id=account.external_account_id,
        onboarding_url=onboarding_url,
        dashboard_url=dashboard_url,
        created_at=account.created_at.isoformat(),
        updated_at=account.updated_at.isoformat()
    )

@router.post("/create", response_model=PayoutAccountResponse)
async def create_payout_account(request: CreatePayoutAccountRequest, user: AuthorizedUser):
    """Create a comprehensive Stripe Connect account with full onboarding data."""
    try:
        repo = PaymentRepository(user.sub)

        # Get account_id for multi-tenant support
        account_id = await repo._get_user_account_id()

        # Check if user already has a payout account
        existing_account = await repo.get_payout_account()
        if existing_account:
            raise HTTPException(status_code=400, detail="Payout account already exists")

        # Validate and sanitize business profile URL (optional)
        try:
            sanitized_url = sanitize_business_url(request.business_profile.url)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid business URL: {str(e)}")

        # Create Stripe Connect Custom account with comprehensive data
        print(f"Creating Stripe Custom account for user {user.sub} with sanitized URL: {sanitized_url}")
        
        # Build business profile (URL is optional)
        business_profile = {
            "name": request.business_profile.name,
            "mcc": request.business_profile.mcc,
            "product_description": request.business_profile.product_description,
        }
        if sanitized_url:
            business_profile["url"] = sanitized_url

        # For individual accounts, use the same address for business and individual
        address_data = {
            "line1": request.representative.address_line1,
            "city": request.representative.address_city,
            "postal_code": request.representative.address_postal_code,
            "country": request.representative.address_country,
        }
        if request.representative.address_state:
            address_data["state"] = request.representative.address_state

        # Build account creation parameters for Custom account
        account_params = {
            "type": "custom",
            "country": request.country,
            "business_type": request.business_type,
            "business_profile": business_profile,
            "individual": {
                "first_name": request.representative.first_name,
                "last_name": request.representative.last_name,
                "email": request.representative.email,
                "phone": request.representative.phone,
                "address": address_data,
                "dob": {
                    "day": request.representative.dob_day,
                    "month": request.representative.dob_month,
                    "year": request.representative.dob_year,
                },
            },
            "external_account": {
                "object": "bank_account",
                "country": request.bank_account.country,
                "currency": request.bank_account.currency,
                "account_number": request.bank_account.account_number,
                "routing_number": request.bank_account.routing_number,
                "account_holder_name": request.bank_account.account_holder_name,
            },
            "capabilities": {
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            # Custom accounts require explicit agreement to terms
            "tos_acceptance": {
                "service_agreement": "recipient"
            },
        }
        
        # For individual business types, add company address (same as individual for sole proprietors)
        if request.business_type == "individual":
            account_params["company"] = {
                "address": address_data,
                "name": request.business_profile.name,
            }

        stripe_account = stripe.Account.create(**account_params)

        print(f"Stripe account created successfully: {stripe_account.id}")

        # Create payout account in database
        payout_account = PayoutAccount(
            id=uuid4(),
            user_id=user.sub,
            account_id=account_id,
            stripe_account_id=stripe_account.id,
            account_status=PayoutAccountStatus.PENDING,
            business_type=request.business_type,
            country=request.country,
            email=request.representative.email,
            requirements_currently_due=stripe_account.requirements.currently_due or [],
            requirements_past_due=stripe_account.requirements.past_due or [],
            charges_enabled=stripe_account.charges_enabled,
            payouts_enabled=stripe_account.payouts_enabled,
            details_submitted=stripe_account.details_submitted,
            capabilities=dict(stripe_account.capabilities) if stripe_account.capabilities else {},
        )

        created_account = await repo.create_payout_account(payout_account)

        # Create account link for any remaining onboarding (should be minimal)
        if mode == Mode.PROD:
            base_url = "https://kavonk.databutton.app/payflow-pro"
        else:
            base_url = "https://databutton.com/_projects/f263b849-f255-4941-b718-64221e5922dc/dbtn/devx/ui"

        account_link = stripe.AccountLink.create(
            account=stripe_account.id,
            refresh_url=f"{base_url}/settings?refresh=true",
            return_url=f"{base_url}/settings?success=true",
            type="account_onboarding",
        )

        return _payout_account_to_response(created_account, onboarding_url=account_link.url)

    except stripe.error.InvalidRequestError as e:
        error_msg = f"Stripe validation error: {str(e)}"
        print(f"Stripe InvalidRequestError: {error_msg}")
        print(f"Error details: {e.user_message if hasattr(e, 'user_message') else 'No additional details'}")
        raise HTTPException(status_code=400, detail=error_msg)
    except stripe.error.StripeError as e:
        error_msg = f"Stripe error: {str(e)}"
        print(f"StripeError: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        error_msg = f"Internal error: {str(e)}"
        print(f"Unexpected error in create_payout_account: {error_msg}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/create-simple", response_model=PayoutAccountResponse)
async def create_simple_payout_account(request: CreateSimplePayoutAccountRequest, user: AuthorizedUser):
    """Create a new Stripe Connect account for payouts."""
    try:
        repo = PaymentRepository(user.sub)

        # Get account_id for multi-tenant support
        account_id = await repo._get_user_account_id()

        # Check if user already has a payout account
        existing_account = await repo.get_payout_account()
        if existing_account:
            raise HTTPException(status_code=400, detail="Payout account already exists")

        # Create Stripe Connect Custom account (simple version)
        stripe_account = stripe.Account.create(
            type="custom",
            country=request.country,
            email=request.email or getattr(user, 'email', None),
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            # Custom accounts require explicit agreement to terms
            tos_acceptance={
                "service_agreement": "recipient"
            },
        )

        # Create payout account in database
        payout_account = PayoutAccount(
            id=uuid4(),
            user_id=user.sub,
            account_id=account_id,
            stripe_account_id=stripe_account.id,
            account_status=PayoutAccountStatus.PENDING,
            business_type=request.business_type,
            country=request.country,
            email=request.email or user.email,
            requirements_currently_due=stripe_account.requirements.currently_due or [],
            requirements_past_due=stripe_account.requirements.past_due or [],
            charges_enabled=stripe_account.charges_enabled,
            payouts_enabled=stripe_account.payouts_enabled,
            details_submitted=stripe_account.details_submitted,
            capabilities=dict(stripe_account.capabilities) if stripe_account.capabilities else {},
        )

        created_account = await repo.create_payout_account(payout_account)

        # Create account link for onboarding
        if mode == Mode.PROD:
            base_url = "https://kavonk.databutton.app/payflow-pro"
        else:
            base_url = "https://databutton.com/_projects/f263b849-f255-4941-b718-64221e5922dc/dbtn/devx/ui"

        account_link = stripe.AccountLink.create(
            account=stripe_account.id,
            refresh_url=f"{base_url}/settings?refresh=true",
            return_url=f"{base_url}/settings?success=true",
            type="account_onboarding",
        )

        return _payout_account_to_response(created_account, onboarding_url=account_link.url)

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/payout-account", response_model=Optional[PayoutAccountResponse])
async def get_current_payout_account(user: AuthorizedUser):
    """Get the current user's payout account."""
    try:
        repo = PaymentRepository(user.sub)
        account = await repo.get_payout_account()

        if not account:
            return None

        # Get fresh data from Stripe
        try:
            stripe_account = stripe.Account.retrieve(account.stripe_account_id)

            # Update account with fresh Stripe data
            account.requirements_currently_due = stripe_account.requirements.currently_due or []
            account.requirements_past_due = stripe_account.requirements.past_due or []
            account.charges_enabled = stripe_account.charges_enabled
            account.payouts_enabled = stripe_account.payouts_enabled
            account.details_submitted = stripe_account.details_submitted
            account.capabilities = dict(stripe_account.capabilities) if stripe_account.capabilities else {}

            # Update account status based on Stripe data
            if stripe_account.requirements.disabled_reason:
                account.account_status = PayoutAccountStatus.RESTRICTED
            elif len(stripe_account.requirements.currently_due) > 0:
                account.account_status = PayoutAccountStatus.INCOMPLETE
            elif stripe_account.charges_enabled and stripe_account.payouts_enabled:
                account.account_status = PayoutAccountStatus.ACTIVE

            account.updated_at = datetime.now(timezone.utc)
            await repo.update_payout_account(account)

            # Generate dashboard link if account is active
            dashboard_url = None
            if account.account_status == PayoutAccountStatus.ACTIVE:
                try:
                    login_link = stripe.Account.create_login_link(account.stripe_account_id)
                    dashboard_url = login_link.url
                except stripe.error.StripeError:
                    pass  # Dashboard link creation failed, continue without it

            return _payout_account_to_response(account, dashboard_url=dashboard_url)

        except stripe.error.StripeError as e:
            # If Stripe call fails, return cached data
            return _payout_account_to_response(account)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/onboarding-link", response_model=AccountLinkResponse)
async def create_onboarding_link(user: AuthorizedUser):
    """Create a new onboarding link for incomplete accounts."""
    try:
        repo = PaymentRepository(user.sub)
        account = await repo.get_payout_account()

        if not account:
            raise HTTPException(status_code=404, detail="No payout account found")

        if account.account_status == PayoutAccountStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Account is already active")

        # Create account link for onboarding
        if mode == Mode.PROD:
            base_url = "https://kavonk.databutton.app/payflow-pro"
        else:
            base_url = "https://databutton.com/_projects/f263b849-f255-4941-b718-64221e5922dc/dbtn/devx/ui"

        account_link = stripe.AccountLink.create(
            account=account.stripe_account_id,
            refresh_url=f"{base_url}/settings?refresh=true",
            return_url=f"{base_url}/settings?success=true",
            type="account_onboarding",
        )

        return AccountLinkResponse(url=account_link.url)

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/refresh", response_model=PayoutAccountResponse)
async def refresh_payout_account(user: AuthorizedUser):
    """Refresh payout account status from Stripe."""
    try:
        repo = PaymentRepository(user.sub)
        account = await repo.get_payout_account()

        if not account:
            raise HTTPException(status_code=404, detail="No payout account found")

        # Get fresh data from Stripe
        stripe_account = stripe.Account.retrieve(account.stripe_account_id)

        # Update account with fresh Stripe data
        account.requirements_currently_due = stripe_account.requirements.currently_due or []
        account.requirements_past_due = stripe_account.requirements.past_due or []
        account.charges_enabled = stripe_account.charges_enabled
        account.payouts_enabled = stripe_account.payouts_enabled
        account.details_submitted = stripe_account.details_submitted
        account.capabilities = dict(stripe_account.capabilities) if stripe_account.capabilities else {}

        # Update account status based on Stripe data
        if stripe_account.requirements.disabled_reason:
            account.account_status = PayoutAccountStatus.RESTRICTED
        elif len(stripe_account.requirements.currently_due) > 0:
            account.account_status = PayoutAccountStatus.INCOMPLETE
        elif stripe_account.charges_enabled and stripe_account.payouts_enabled:
            account.account_status = PayoutAccountStatus.ACTIVE

        account.updated_at = datetime.now(timezone.utc)
        updated_account = await repo.update_payout_account(account)

        return _payout_account_to_response(updated_account)

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
