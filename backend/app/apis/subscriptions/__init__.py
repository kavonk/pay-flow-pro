from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import stripe
import databutton as db
import json
import asyncpg

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.models import (
    SubscriptionPlan, UserSubscription, BillingHistory,
    SubscriptionStatus, BillingStatus, BillingReason, UserRole,
    PayoutAccount, PayoutAccountStatus
)

# Initialize Stripe
stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")
try:
    stripe_webhook_secret = db.secrets.get("STRIPE_WEBHOOK_SECRET")
except Exception:
    stripe_webhook_secret = None  # Optional for testing

router = APIRouter()

# Request/Response Models
class SubscriptionPlanResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    price_monthly: Decimal
    price_yearly: Optional[Decimal] = None
    features: List[str]
    transaction_fee_percentage: Decimal
    max_invoices_per_month: Optional[int] = None
    max_customers: Optional[int] = None
    has_custom_branding: bool
    has_priority_support: bool
    has_recurring_billing: bool
    yearly_discount_percentage: float
    is_trial: bool

class UserSubscriptionResponse(BaseModel):
    id: UUID
    user_id: str
    status: str
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None
    canceled_at: Optional[datetime] = None
    cancel_at_period_end: bool
    plan: Optional[SubscriptionPlanResponse] = None
    trial_days_remaining: int
    is_trial: bool
    is_active: bool
    requires_upgrade_prompt: bool
    created_at: datetime
    updated_at: datetime

class StripeBillingHistoryResponse(BaseModel):
    id: str
    amount: Decimal
    currency: str
    status: str
    description: str
    invoice_url: Optional[str] = None
    receipt_url: Optional[str] = None
    payment_date: datetime
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    payment_method: Optional[str] = None
    last_four: Optional[str] = None
    invoice_number: Optional[str] = None

class BillingHistoryListResponse(BaseModel):
    history: List[StripeBillingHistoryResponse]
    has_more: bool
    total_count: int

# Legacy response for backward compatibility
class BillingHistoryResponse(BaseModel):
    id: UUID
    amount: Decimal
    currency: str
    status: str
    billing_reason: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

class StartTrialRequest(BaseModel):
    payment_method_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None

class UpgradeSubscriptionRequest(BaseModel):
    plan_slug: str = Field(..., description="Target subscription plan slug")
    billing_cycle: str = Field("monthly", description="'monthly' or 'yearly'")
    payment_method_id: Optional[str] = Field(None, description="Stripe payment method ID")
    return_url: Optional[str] = Field(None, description="URL to return to after payment")

class CreateCheckoutSessionRequest(BaseModel):
    plan_slug: str = Field(..., description="Target subscription plan slug")
    billing_cycle: str = Field("monthly", description="'monthly' or 'yearly'")
    success_url: str = Field(..., description="URL to redirect on successful payment")
    cancel_url: str = Field(..., description="URL to redirect on canceled payment")

class CheckoutSessionResponse(BaseModel):
    checkout_session_id: str
    checkout_url: str

class StripeConfigResponse(BaseModel):
    publishable_key: str

class CancelSubscriptionRequest(BaseModel):
    cancel_at_period_end: bool = Field(True, description="Cancel at end of current period or immediately")
    cancellation_reason: Optional[str] = None

class CustomerPortalRequest(BaseModel):
    return_url: str = Field(..., description="URL to return to after portal session")

class CustomerPortalResponse(BaseModel):
    portal_url: str

# Helper functions
def _subscription_plan_to_response(plan: SubscriptionPlan) -> SubscriptionPlanResponse:
    """Convert SubscriptionPlan model to response."""
    return SubscriptionPlanResponse(
        id=plan.id,
        name=plan.name,
        slug=plan.slug,
        description=plan.description,
        price_monthly=plan.price_monthly,
        price_yearly=plan.price_yearly,
        features=plan.features,
        transaction_fee_percentage=plan.transaction_fee_percentage,
        max_invoices_per_month=plan.max_invoices_per_month,
        max_customers=plan.max_customers,
        has_custom_branding=plan.has_custom_branding,
        has_priority_support=plan.has_priority_support,
        has_recurring_billing=plan.has_recurring_billing,
        yearly_discount_percentage=plan.yearly_discount_percentage,
        is_trial=plan.is_trial
    )

def _user_subscription_to_response(subscription: UserSubscription) -> UserSubscriptionResponse:
    """Convert UserSubscription model to response."""
    plan_response = None
    if subscription.plan:
        plan_response = _subscription_plan_to_response(subscription.plan)
    
    # Safely get requires_upgrade_prompt, handling potential None values
    try:
        requires_upgrade_prompt = subscription.requires_upgrade_prompt
    except (AttributeError, TypeError):
        # Fallback if plan data is incomplete
        requires_upgrade_prompt = False
    
    return UserSubscriptionResponse(
        id=subscription.id,
        user_id=subscription.user_id,
        status=subscription.status.value,
        trial_start_date=subscription.trial_start_date,
        trial_end_date=subscription.trial_end_date,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        card_last_four=subscription.card_last_four,
        card_brand=subscription.card_brand,
        canceled_at=subscription.canceled_at,
        cancel_at_period_end=subscription.cancel_at_period_end,
        plan=plan_response,
        trial_days_remaining=subscription.trial_days_remaining,
        is_trial=subscription.is_trial,
        is_active=subscription.is_active,
        requires_upgrade_prompt=requires_upgrade_prompt,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at
    )

def _billing_history_to_response(billing: BillingHistory) -> BillingHistoryResponse:
    """Convert BillingHistory model to response."""
    return BillingHistoryResponse(
        id=billing.id,
        amount=billing.amount,
        currency=billing.currency,
        status=billing.status.value,
        billing_reason=billing.billing_reason.value if billing.billing_reason else None,
        period_start=billing.period_start,
        period_end=billing.period_end,
        paid_at=billing.paid_at,
        created_at=billing.created_at
    )

# API Endpoints
@router.get("/config", response_model=StripeConfigResponse)
async def get_subscription_stripe_config() -> StripeConfigResponse:
    """Get Stripe configuration for subscription management."""
    publishable_key = db.secrets.get("STRIPE_PUBLISHABLE_KEY")
    if not publishable_key:
        raise HTTPException(status_code=500, detail="Stripe publishable key not configured")
    
    return StripeConfigResponse(publishable_key=publishable_key)

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans() -> List[SubscriptionPlanResponse]:
    """Get all available subscription plans."""
    # Create a temporary repository to access plans (plans are not user-specific)
    repo = PaymentRepository("temp")
    plans = await repo.get_subscription_plans(active_only=True)
    return [_subscription_plan_to_response(plan) for plan in plans]

@router.get("/current", response_model=Optional[UserSubscriptionResponse])
async def get_current_subscription(user: AuthorizedUser) -> Optional[UserSubscriptionResponse]:
    """Get current user's subscription."""
    repo = PaymentRepository(user.sub)
    subscription = await repo.get_user_subscription()
    
    if not subscription:
        return None
    
    return _user_subscription_to_response(subscription)

@router.post("/start-trial", response_model=UserSubscriptionResponse)
async def start_trial(request: StartTrialRequest, user: AuthorizedUser) -> UserSubscriptionResponse:
    """Start a free trial for a new user (now works for all users)."""
    repo = PaymentRepository(user.sub)
    
    # Ensure user has account access (this will create account if needed)
    account_id = await repo._get_user_account_id()
    
    # Allow both admin and member users to start trials
    # Admin users create new accounts, member users join existing accounts via invitation
    user_account = await repo.get_user_account()
    if not user_account:
        raise HTTPException(
            status_code=403, 
            detail="Unable to determine user account access."
        )
    
    # Check if account already has a subscription
    existing_subscription = await repo.get_user_subscription()
    if existing_subscription:
        # If subscription exists, return it instead of erroring
        existing_subscription.plan = await repo.get_subscription_plan_by_id(existing_subscription.plan_id)
        return _user_subscription_to_response(existing_subscription)
    
    # Get free plan for trial
    trial_plan = await repo.get_subscription_plan_by_slug("free")
    if not trial_plan:
        raise HTTPException(status_code=500, detail="Free plan not found")
    
    stripe_customer_id = await repo.get_or_create_stripe_customer(user.email if hasattr(user, 'email') else None)
    
    # If payment method ID is provided, attach to Stripe customer
    if request.payment_method_id:
        try:
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                request.payment_method_id,
                customer=stripe_customer_id,
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={'default_payment_method': request.payment_method_id}
            )
            
            print(f"Attached payment method {request.payment_method_id} to customer {stripe_customer_id}")
            
        except Exception as e:
            print(f"Error attaching payment method: {e}")
            # Don't fail the trial creation if attaching payment method fails
            print(f"Continuing with trial creation without attaching payment method")
    
    # Create trial subscription
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=14)  # 14-day trial as specified
    
    # Use the account_id we already retrieved
    subscription = UserSubscription(
        id=uuid4(),
        user_id=user.sub,
        account_id=account_id,
        plan_id=trial_plan.id,
        status=SubscriptionStatus.TRIAL,
        trial_start_date=now,
        trial_end_date=trial_end,
        # IMPORTANT: During trial, billing period fields stay null
        # They will be set when trial converts to paid subscription
        current_period_start=None,
        current_period_end=None,
        stripe_customer_id=stripe_customer_id,
        card_last_four=request.card_last_four,
        card_brand=request.card_brand,
        created_at=now,
        updated_at=now
    )
    
    # Create the subscription with duplicate handling
    try:
        created_subscription = await repo.create_user_subscription(subscription)
        created_subscription.plan = trial_plan
        print(f"Successfully created trial subscription for user {user.sub}")
        
        # PHASE 1: Auto-create simple payout account for seamless onboarding
        await _create_simple_payout_account_for_trial(user, repo)
        
        return _user_subscription_to_response(created_subscription)
    except Exception as create_error:
        print(f"Error creating subscription for user {user.sub}: {str(create_error)}")
        
        # If constraint violation (duplicate), return existing subscription
        if "duplicate key value violates unique constraint" in str(create_error):
            print(f"Duplicate subscription detected in start_trial for user {user.sub}, fetching existing")
            
            # Wait a moment and try again to avoid race conditions
            await asyncio.sleep(0.5)
            existing_subscription = await repo.get_user_subscription()
            
            if existing_subscription:
                print(f"Found existing subscription for user {user.sub}: {existing_subscription.id}")
                existing_subscription.plan = await repo.get_subscription_plan_by_id(existing_subscription.plan_id)
                return _user_subscription_to_response(existing_subscription)
            else:
                print(f"Still no subscription found after duplicate error for user {user.sub}")
                # Try one more time to create the subscription
                try:
                    print(f"Retrying subscription creation for user {user.sub}")
                    created_subscription = await repo.create_user_subscription(subscription)
                    created_subscription.plan = trial_plan
                    print(f"Retry successful for user {user.sub}")
                    
                    # PHASE 1: Auto-create simple payout account for seamless onboarding
                    await _create_simple_payout_account_for_trial(user, repo)
                    
                    return _user_subscription_to_response(created_subscription)
                except Exception as retry_error:
                    print(f"Retry also failed for user {user.sub}: {str(retry_error)}")
                    raise HTTPException(status_code=500, detail=f"Could not create or find subscription after multiple attempts: {str(retry_error)}")
        else:
            # Re-raise other errors
            raise HTTPException(status_code=500, detail=f"Failed to create subscription: {str(create_error)}")

async def _create_simple_payout_account_for_trial(user: AuthorizedUser, repo: PaymentRepository) -> None:
    """Helper function to auto-create simple payout account during trial signup.
    
    This creates a Stripe Connect Express account with basic setup to allow
    immediate invoice creation. Users can complete full onboarding later.
    """
    try:
        # Check if user already has a payout account
        existing_account = await repo.get_payout_account()
        if existing_account:
            print(f"User {user.sub} already has payout account, skipping auto-creation")
            return
        
        # Get account_id for multi-tenant support
        account_id = await repo._get_user_account_id()
        
        # Extract user email - try different ways to get it
        user_email = None
        if hasattr(user, 'email') and user.email:
            user_email = user.email
        elif hasattr(user, 'primaryEmail') and user.primaryEmail:
            user_email = user.primaryEmail
        
        print(f"Creating simple payout account for user {user.sub} with email {user_email}")
        
        # Create Stripe Connect Express account
        stripe_account = stripe.Account.create(
            type="express",
            country="IE",  # Default to Ireland as requested
            email=user_email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
        )
        
        # Create payout account in database
        payout_account = PayoutAccount(
            id=uuid4(),
            user_id=user.sub,
            account_id=account_id,
            stripe_account_id=stripe_account.id,
            account_status=PayoutAccountStatus.PENDING,
            business_type="individual",  # Default to individual
            country="IE",
            email=user_email,
            requirements_currently_due=stripe_account.requirements.currently_due or [],
            requirements_past_due=stripe_account.requirements.past_due or [],
            charges_enabled=stripe_account.charges_enabled,
            payouts_enabled=stripe_account.payouts_enabled,
            details_submitted=stripe_account.details_submitted,
            capabilities=dict(stripe_account.capabilities) if stripe_account.capabilities else {},
        )
        
        await repo.create_payout_account(payout_account)
        print(f"Successfully created simple payout account {stripe_account.id} for user {user.sub}")
        
    except Exception as e:
        # Don't fail trial creation if payout account creation fails
        print(f"Warning: Failed to auto-create payout account for user {user.sub}: {str(e)}")
        print("Trial creation will continue without payout account")
        # We don't raise the exception to avoid blocking trial signup

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(request: CreateCheckoutSessionRequest, user: AuthorizedUser) -> CheckoutSessionResponse:
    """Create a Stripe checkout session for subscription upgrade."""
    repo = PaymentRepository(user.sub)
    
    # Get current subscription
    current_subscription = await repo.get_user_subscription()
    if not current_subscription:
        raise HTTPException(status_code=404, detail="No current subscription found")
    
    # Get target plan
    target_plan = await repo.get_subscription_plan_by_slug(request.plan_slug)
    if not target_plan:
        raise HTTPException(status_code=404, detail=f"Plan '{request.plan_slug}' not found")
    
    try:
        # Create or get Stripe customer
        stripe_customer_id = await repo.get_or_create_stripe_customer(user.email if hasattr(user, 'email') else None)
        
        # Get price based on billing cycle
        price_amount = target_plan.price_yearly if request.billing_cycle == "yearly" else target_plan.price_monthly
        if not price_amount or price_amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid plan pricing")
        
        # Create Stripe product and price dynamically
        product = stripe.Product.create(
            name=f"PayFlow Pro {target_plan.name}",
            description=target_plan.description or f"PayFlow Pro {target_plan.name} Plan"
        )
        
        price = stripe.Price.create(
            unit_amount=int(price_amount * 100),  # Convert to cents
            currency="eur",
            recurring={
                "interval": "year" if request.billing_cycle == "yearly" else "month"
            },
            product=product.id,
        )
        
        # Create checkout session for subscription
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price.id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.success_url + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.cancel_url,
            metadata={
                'user_id': user.sub,
                'subscription_id': str(current_subscription.id),
                'plan_slug': request.plan_slug,
                'billing_cycle': request.billing_cycle
            }
        )
        
        return CheckoutSessionResponse(
            checkout_session_id=checkout_session.id,
            checkout_url=checkout_session.url
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@router.post("/upgrade", response_model=UserSubscriptionResponse)
async def upgrade_subscription(request: UpgradeSubscriptionRequest, user: AuthorizedUser) -> UserSubscriptionResponse:
    """Upgrade user's subscription to a paid plan (for direct payment method upgrades)."""
    repo = PaymentRepository(user.sub)
    
    # Get current subscription
    current_subscription = await repo.get_user_subscription()
    if not current_subscription:
        raise HTTPException(
            status_code=404, 
            detail="No active subscription found. Please start a trial or subscribe first."
        )
    
    # Get target plan
    target_plan = await repo.get_subscription_plan_by_slug(request.plan_slug)
    if not target_plan:
        raise HTTPException(status_code=404, detail=f"Plan '{request.plan_slug}' not found")
    
    try:
        # Create or get Stripe customer
        stripe_customer_id = await repo.get_or_create_stripe_customer(user.email if hasattr(user, 'email') else None)
        
        # Attach payment method if provided
        if request.payment_method_id:
            stripe.PaymentMethod.attach(
                request.payment_method_id,
                customer=stripe_customer_id,
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={'default_payment_method': request.payment_method_id}
            )
        
        # Get price amount
        price_amount = target_plan.price_yearly if request.billing_cycle == "yearly" else target_plan.price_monthly
        if not price_amount or price_amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid plan pricing")
        
        # Create Stripe price
        price = stripe.Price.create(
            unit_amount=int(price_amount * 100),
            currency="eur",
            recurring={
                "interval": "year" if request.billing_cycle == "yearly" else "month"
            },
            product_data={
                "name": f"PayFlow Pro {target_plan.name}",
                "description": target_plan.description or f"PayFlow Pro {target_plan.name} Plan"
            },
        )
        
        # Create Stripe subscription
        stripe_subscription = stripe.Subscription.create(
            customer=stripe_customer_id,
            items=[{'price': price.id}],
            metadata={
                'user_id': user.sub,
                'plan_slug': request.plan_slug
            }
        )
        
        # Update local subscription
        now = datetime.now(timezone.utc)
        current_subscription.plan_id = target_plan.id
        current_subscription.status = SubscriptionStatus.ACTIVE
        current_subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start, timezone.utc)
        current_subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end, timezone.utc)
        current_subscription.stripe_subscription_id = stripe_subscription.id
        current_subscription.stripe_customer_id = stripe_customer_id
        current_subscription.updated_at = now
        
        # Get payment method details if available
        if request.payment_method_id:
            payment_method = stripe.PaymentMethod.retrieve(request.payment_method_id)
            if payment_method.card:
                current_subscription.card_last_four = payment_method.card.last4
                current_subscription.card_brand = payment_method.card.brand
        
        updated_subscription = await repo.update_user_subscription(current_subscription)
        if not updated_subscription:
            raise HTTPException(status_code=500, detail="Failed to update subscription")
        
        updated_subscription.plan = target_plan
        
        return _user_subscription_to_response(updated_subscription)
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upgrade subscription: {str(e)}")

@router.post("/cancel", response_model=UserSubscriptionResponse)
async def cancel_subscription(request: CancelSubscriptionRequest, user: AuthorizedUser) -> UserSubscriptionResponse:
    """Cancel user's subscription."""
    repo = PaymentRepository(user.sub)
    
    # Get current subscription
    current_subscription = await repo.get_user_subscription()
    if not current_subscription:
        raise HTTPException(status_code=404, detail="No current subscription found")
    
    if current_subscription.status == SubscriptionStatus.CANCELED:
        raise HTTPException(status_code=400, detail="Subscription is already canceled")
    
    try:
        # Cancel Stripe subscription if exists
        if current_subscription.stripe_subscription_id:
            if request.cancel_at_period_end:
                stripe.Subscription.modify(
                    current_subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
            else:
                stripe.Subscription.cancel(
                    current_subscription.stripe_subscription_id
                )
        
        # Update local subscription
        now = datetime.now(timezone.utc)
        current_subscription.cancel_at_period_end = request.cancel_at_period_end
        
        if not request.cancel_at_period_end:
            # Cancel immediately
            current_subscription.status = SubscriptionStatus.CANCELED
            current_subscription.canceled_at = now
        
        current_subscription.updated_at = now
        
        updated_subscription = await repo.update_user_subscription(current_subscription)
        if not updated_subscription:
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
        
        # Get the complete subscription with plan data after update
        final_subscription = await repo.get_user_subscription()
        if not final_subscription:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated subscription")
        
        return _user_subscription_to_response(final_subscription)
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")

@router.get("/billing-history", response_model=BillingHistoryListResponse)
async def get_billing_history(
    user: AuthorizedUser,
    limit: int = 10,
    starting_after: Optional[str] = None
) -> BillingHistoryListResponse:
    """Get billing history from Stripe for the current user."""
    repo = PaymentRepository(user.sub)
    
    # Get current subscription to find Stripe customer ID
    subscription = await repo.get_user_subscription()
    if not subscription or not subscription.stripe_customer_id:
        return BillingHistoryListResponse(
            history=[],
            has_more=False,
            total_count=0
        )
    
    try:
        # Fetch charges from Stripe
        charges_params = {
            'customer': subscription.stripe_customer_id,
            'limit': limit,
            'expand': ['data.invoice']
        }
        
        if starting_after:
            charges_params['starting_after'] = starting_after
            
        charges = stripe.Charge.list(**charges_params)
        
        # Also fetch invoices for subscription billing periods
        invoices_params = {
            'customer': subscription.stripe_customer_id,
            'limit': limit,
            'expand': ['data.charge', 'data.payment_intent']
        }
        
        if starting_after:
            invoices_params['starting_after'] = starting_after
            
        invoices = stripe.Invoice.list(**invoices_params)
        
        # Convert to our response format
        history_items = []
        
        # Process successful charges
        for charge in charges.data:
            if charge.status == 'succeeded' and charge.amount > 0:
                # Get payment method details
                payment_method = None
                last_four = None
                
                if charge.payment_method_details:
                    if charge.payment_method_details.card:
                        payment_method = f"{charge.payment_method_details.card.brand.title()} Card"
                        last_four = charge.payment_method_details.card.last4
                    elif charge.payment_method_details.sepa_debit:
                        payment_method = "SEPA Direct Debit"
                        last_four = charge.payment_method_details.sepa_debit.last4
                
                # Get period info from associated invoice if available
                period_start = None
                period_end = None
                invoice_url = None
                invoice_number = None
                
                if charge.invoice:
                    invoice = charge.invoice if isinstance(charge.invoice, dict) else stripe.Invoice.retrieve(charge.invoice)
                    period_start = datetime.fromtimestamp(invoice.period_start, timezone.utc) if invoice.period_start else None
                    period_end = datetime.fromtimestamp(invoice.period_end, timezone.utc) if invoice.period_end else None
                    invoice_url = invoice.invoice_pdf
                    invoice_number = invoice.number
                
                history_items.append(StripeBillingHistoryResponse(
                    id=charge.id,
                    amount=Decimal(str(charge.amount / 100)),  # Convert from cents
                    currency=charge.currency.upper(),
                    status='succeeded',
                    description=charge.description or 'PayFlow Pro Subscription',
                    invoice_url=invoice_url,
                    receipt_url=charge.receipt_url,
                    payment_date=datetime.fromtimestamp(charge.created, timezone.utc),
                    period_start=period_start,
                    period_end=period_end,
                    payment_method=payment_method,
                    last_four=last_four,
                    invoice_number=invoice_number
                ))
        
        # Process failed invoices/charges for transparency
        for invoice in invoices.data:
            if invoice.status in ['open', 'past_due', 'payment_failed'] and invoice.amount_due > 0:
                history_items.append(StripeBillingHistoryResponse(
                    id=invoice.id,
                    amount=Decimal(str(invoice.amount_due / 100)),
                    currency=invoice.currency.upper(),
                    status=invoice.status,
                    description=f"Invoice {invoice.number or invoice.id}",
                    invoice_url=invoice.invoice_pdf,
                    receipt_url=None,
                    payment_date=datetime.fromtimestamp(invoice.created, timezone.utc),
                    period_start=datetime.fromtimestamp(invoice.period_start, timezone.utc) if invoice.period_start else None,
                    period_end=datetime.fromtimestamp(invoice.period_end, timezone.utc) if invoice.period_end else None,
                    payment_method=None,
                    last_four=None,
                    invoice_number=invoice.number
                ))
        
        # Sort by payment date (newest first)
        history_items.sort(key=lambda x: x.payment_date, reverse=True)
        
        # Limit results
        limited_history = history_items[:limit]
        
        return BillingHistoryListResponse(
            history=limited_history,
            has_more=len(history_items) > limit or charges.has_more or invoices.has_more,
            total_count=len(history_items)
        )
        
    except stripe.error.StripeError as e:
        error_msg = str(e)
        print(f"Stripe error fetching billing history for user {user.sub}: {error_msg}")
        
        # Check if this is a live/test mode mismatch
        if "similar object exists in live mode" in error_msg and "test mode key" in error_msg:
            print(f"Live/test mode customer ID mismatch detected for user {user.sub}. Resetting subscription customer ID.")
            
            # Create a new test customer and update the subscription
            try:
                customer = stripe.Customer.create(
                    email=user.email if hasattr(user, 'email') else None,
                    metadata={'user_id': user.sub}
                )
                
                # Update the subscription with the new test customer ID
                subscription.stripe_customer_id = customer.id
                subscription.updated_at = datetime.now(timezone.utc)
                await repo.update_user_subscription(subscription)
                
                print(f"Created new test customer {customer.id} for user {user.sub}")
                
                # Return empty history for now - new customer has no history
                return BillingHistoryListResponse(
                    history=[],
                    has_more=False,
                    total_count=0
                )
                
            except Exception as reset_error:
                print(f"Failed to reset customer ID for user {user.sub}: {str(reset_error)}")
                # Fall through to original error
        
        raise HTTPException(status_code=400, detail=f"Error fetching billing history: {error_msg}")
    except Exception as e:
        print(f"Error fetching billing history for user {user.sub}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/customer-portal", response_model=CustomerPortalResponse)
async def create_customer_portal(request: CustomerPortalRequest, user: AuthorizedUser) -> CustomerPortalResponse:
    """Create Stripe Customer Portal session for payment method and billing management."""
    repo = PaymentRepository(user.sub)
    
    # Get current subscription with atomic creation if needed
    current_subscription = await repo.get_user_subscription()
    if not current_subscription:
        # Auto-trial enrollment if no subscription exists using atomic operation
        print(f"No subscription found for user {user.sub}, creating auto-trial subscription with atomic operation...")
        
        try:
            async def subscription_factory():
                """Factory function to create a trial subscription with Stripe customer."""
                now = datetime.now(timezone.utc)
                trial_plan = await repo.get_subscription_plan_by_slug("free")
                if not trial_plan:
                    raise HTTPException(status_code=500, detail="Free plan not configured")
                
                # Create Stripe customer first
                customer = stripe.Customer.create(
                    email=user.email if hasattr(user, 'email') else None,
                    metadata={'user_id': user.sub}
                )
                
                # Get account ID
                account_id = await repo._get_user_account_id()
                
                # Create UserSubscription object
                from uuid import uuid4
                subscription = UserSubscription(
                    id=uuid4(),
                    user_id=user.sub,
                    account_id=account_id,
                    plan_id=trial_plan.id,
                    status=SubscriptionStatus.TRIAL,
                    trial_start_date=now,
                    trial_end_date=now + timedelta(days=28),
                    # IMPORTANT: During trial, billing period fields stay null
                    current_period_start=None,
                    current_period_end=None,
                    stripe_customer_id=customer.id,
                    created_at=now,
                    updated_at=now
                )
                return subscription
            
            current_subscription = await repo.get_or_create_subscription_atomic(subscription_factory)
            print(f"Successfully created/retrieved auto-trial subscription for user {user.sub}")
            
        except stripe.error.StripeError as e:
            print(f"Stripe error during auto-trial creation: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to set up billing account: {str(e)}")
        except Exception as e:
            print(f"Error during atomic auto-trial creation: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create trial subscription")
    
    # If no Stripe customer exists (e.g., auto-trial users), create one on-demand
    stripe_customer_id = current_subscription.stripe_customer_id
    if not stripe_customer_id:
        try:
            print(f"Creating Stripe customer for trial user {user.sub}")
            # Create Stripe customer
            customer = stripe.Customer.create(
                email=user.email if hasattr(user, 'email') else None,
                metadata={'user_id': user.sub}
            )
            stripe_customer_id = customer.id
            
            # Update subscription with the new customer ID
            current_subscription.stripe_customer_id = stripe_customer_id
            current_subscription.updated_at = datetime.now(timezone.utc)
            
            updated_subscription = await repo.update_user_subscription(current_subscription)
            if not updated_subscription:
                print(f"Warning: Failed to update subscription with Stripe customer ID for user {user.sub}")
                # Continue anyway - customer portal will still work with the customer ID
            else:
                print(f"Successfully updated subscription with Stripe customer ID {stripe_customer_id}")
                
        except stripe.error.StripeError as e:
            print(f"Failed to create Stripe customer for user {user.sub}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to set up billing account: {str(e)}")
        except Exception as e:
            print(f"Unexpected error creating Stripe customer for user {user.sub}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to set up billing account")
    
    try:
        # Create Stripe Customer Portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=request.return_url,
        )
        
        return CustomerPortalResponse(portal_url=portal_session.url)
    except stripe.error.InvalidRequestError as e:
        if "No such customer" in str(e):
            # Invalid customer ID in database - create a new customer
            print(f"Invalid Stripe customer ID {stripe_customer_id} for user {user.sub}, creating new customer...")
            try:
                # Create new Stripe customer
                customer = stripe.Customer.create(
                    email=user.email if hasattr(user, 'email') else None,
                    metadata={'user_id': user.sub}
                )
                new_stripe_customer_id = customer.id
                
                # Update subscription with the new customer ID
                current_subscription.stripe_customer_id = new_stripe_customer_id
                current_subscription.updated_at = datetime.now(timezone.utc)
                
                updated_subscription = await repo.update_user_subscription(current_subscription)
                if updated_subscription:
                    print(f"Successfully updated subscription with new Stripe customer ID {new_stripe_customer_id}")
                
                # Try creating portal session again with new customer
                portal_session = stripe.billing_portal.Session.create(
                    customer=new_stripe_customer_id,
                    return_url=request.return_url,
                )
                
                return CustomerPortalResponse(portal_url=portal_session.url)
                
            except Exception as retry_error:
                print(f"Failed to create new customer for user {user.sub}: {str(retry_error)}")
                raise HTTPException(status_code=500, detail="Failed to set up billing account")
        else:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create customer portal: {str(e)}")

@router.get("/feature-access")
async def get_feature_access(user: AuthorizedUser) -> dict:
    """Get user's feature access based on their subscription with auto-trial enrollment."""
    repo = PaymentRepository(user.sub)
    subscription = await repo.get_user_subscription()
    
    # AUTO-TRIAL ENROLLMENT: If no subscription found, automatically create trial using atomic operation
    if not subscription:
        try:
            print(f"No subscription found for user {user.sub}, attempting atomic auto-trial enrollment...")
            
            async def subscription_factory():
                """Factory function to create a trial subscription without Stripe customer."""
                trial_plan = await repo.get_subscription_plan_by_slug("free")
                if not trial_plan:
                    raise Exception("Free plan not found")
                
                # Auto-create trial subscription without payment method
                now = datetime.now(timezone.utc)
                trial_end = now + timedelta(days=14)
                
                account_id = await repo._get_user_account_id()
                from uuid import uuid4
                auto_subscription = UserSubscription(
                    id=uuid4(),
                    user_id=user.sub,
                    account_id=account_id,
                    plan_id=trial_plan.id,
                    status=SubscriptionStatus.TRIAL,
                    trial_start_date=now,
                    trial_end_date=trial_end,
                    # IMPORTANT: During trial, billing period fields stay null
                    current_period_start=None,
                    current_period_end=None,
                    stripe_subscription_id=None,
                    stripe_customer_id=None,  # No payment method required for auto-trial
                    card_last_four=None,
                    card_brand=None,
                    created_at=now,
                    updated_at=now
                )
                return auto_subscription
            
            subscription = await repo.get_or_create_subscription_atomic(subscription_factory)
            subscription.plan = await repo.get_subscription_plan_by_id(subscription.plan_id)
            print(f"Atomic auto-trial subscription created/retrieved for user {user.sub}")
            
        except Exception as e:
            print(f"Atomic auto-trial enrollment failed for user {user.sub}: {e}")
            # Fallback to temporary trial access
            return _get_temporary_trial_access()
    
    # Continue with normal subscription logic...
    return await _get_subscription_feature_access(subscription)

def _get_temporary_trial_access() -> dict:
    """Return temporary trial access when auto-enrollment fails."""
    return {
        "has_access": True,
        "plan_name": "Free Trial (Temporary)",
        "plan_slug": "trial", 
        "can_create_invoices": True,
        "can_use_custom_branding": True,
        "can_use_recurring_billing": True,
        "has_priority_support": True,
        "max_invoices_per_month": None,
        "max_customers": None,
        "transaction_fee_percentage": 0.029,
        "is_trial": True,
        "trial_days_remaining": 14,
        "requires_upgrade_prompt": True,  # Encourage proper signup
        "auto_trial_temporary": True,  # Flag for frontend
        
        # Feature flags for FeatureGate component
        "invoices": True,
        "customers": True,
        "dunning_rules": True,
        "automated_reminders": True,
        "recurring_billing": True,
        "custom_branding": True,
        "advanced_reporting": True,
        "advanced_analytics": True,
        "priority_support": True,
        "api_access": False,
        
        "can_use_automated_reminders": True,
        "can_access_advanced_analytics": True,
        "can_use_api": False,
        "can_use_priority_support": True
    }

async def _get_subscription_feature_access(subscription: UserSubscription) -> dict:
    """Get feature access for users with existing subscriptions."""
    
    # Check if subscription is inactive (but exists)
    if not subscription.is_active:
        return {
            "has_access": False,
            "can_create_invoices": False,
            "can_use_custom_branding": False,
            "can_use_recurring_billing": False,
            "has_priority_support": False,
            "max_invoices_per_month": 0,
            "max_customers": 0,
            "transaction_fee_percentage": 0.029
        }
    
    plan = subscription.plan
    if not plan:
        # Fallback for trial - try to load plan from database
        try:
            from app.libs.repository import PaymentRepository
            repo = PaymentRepository(subscription.user_id)
            plan = await repo.get_subscription_plan_by_slug("trial")
        except:
            pass
    
    if not plan:
        # If no plan found, provide basic trial access
        return _get_temporary_trial_access()
    
    # Feature access logic: Trial users get ALL features, Premium users get ALL features, Basic users get limited features
    is_trial_user = subscription.is_trial
    is_premium_user = plan.slug in ['premium', 'enterprise']
    is_basic_user = plan.slug == 'basic'
    
    # Trial users and Premium users get all features
    has_premium_features = is_trial_user or is_premium_user
    
    return {
        "has_access": True,
        "plan_name": plan.name,
        "plan_slug": plan.slug,
        "can_create_invoices": True,  # All users can create invoices
        "can_use_custom_branding": has_premium_features,
        "can_use_recurring_billing": has_premium_features,
        "has_priority_support": has_premium_features,
        "max_invoices_per_month": plan.max_invoices_per_month,
        "max_customers": plan.max_customers,
        "transaction_fee_percentage": float(plan.transaction_fee_percentage),
        "is_trial": subscription.is_trial,
        "trial_days_remaining": subscription.trial_days_remaining if subscription.is_trial else 0,
        "requires_upgrade_prompt": subscription.requires_upgrade_prompt,
        
        # Feature flags for FeatureGate component
        "invoices": True,  # All users
        "customers": True,  # All users
        "dunning_rules": has_premium_features,  # Premium feature
        "automated_reminders": has_premium_features,  # Premium feature
        "recurring_billing": has_premium_features,  # Premium feature
        "custom_branding": has_premium_features,  # Premium feature
        "advanced_reporting": has_premium_features,  # Premium feature
        "advanced_analytics": has_premium_features,  # Premium feature
        "priority_support": has_premium_features,  # Premium feature
        "api_access": plan.slug == "enterprise",  # Only enterprise gets API access
        
        # Additional backend compatibility flags
        "can_use_automated_reminders": has_premium_features,
        "can_access_advanced_analytics": has_premium_features,
        "can_use_api": plan.slug == "enterprise",
        "can_use_priority_support": has_premium_features
    }

@router.post("/stripe-webhook")
async def subscription_webhook_handler(request: Request):
    """Handle Stripe webhook events for subscription updates."""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    # If webhook secret is configured, verify signature
    if stripe_webhook_secret and sig_header:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, stripe_webhook_secret
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # For testing without webhook secret, parse JSON directly
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # Handle the event
    try:
        if event['type'] == 'checkout.session.completed':
            await handle_checkout_completed(event['data']['object'])
        elif event['type'] == 'customer.subscription.updated':
            await handle_subscription_updated(event['data']['object'])
        elif event['type'] == 'customer.subscription.deleted':
            await handle_subscription_deleted(event['data']['object'])
        elif event['type'] == 'invoice.payment_succeeded':
            await handle_payment_succeeded(event['data']['object'])
        elif event['type'] == 'invoice.payment_failed':
            await handle_payment_failed(event['data']['object'])
        else:
            print(f"Unhandled event type: {event['type']}")
            
    except Exception as e:
        print(f"Error handling webhook event: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing webhook")
    
    return JSONResponse(content={"received": True})

@router.post("/convert-expired-trials")
async def convert_expired_trials():
    """Convert expired trials to Premium subscriptions."""
    # This endpoint will be called by a scheduled job or webhook
    try:
        converted_count = await process_expired_trials()
        return JSONResponse(content={
            "success": True, 
            "converted_count": converted_count
        })
    except Exception as e:
        print(f"Error converting expired trials: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing expired trials")

async def process_expired_trials() -> int:
    """Process all expired trials and convert them to Premium subscriptions."""
    # Get all expired trial subscriptions using a temporary repo for admin operations
    import asyncpg
    from app.env import mode, Mode
    
    database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
    if not database_url:
        raise Exception("Database URL not configured")
    
    converted_count = 0
    
    conn = await asyncpg.connect(database_url)
    try:
        query = """
            SELECT us.*, sp.slug as plan_slug
            FROM user_subscriptions us
            LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.status = 'trial' 
            AND us.trial_end_date < CURRENT_TIMESTAMP
            AND us.stripe_customer_id IS NOT NULL
        """
        
        rows = await conn.fetch(query)
        
        for row in rows:
            try:
                await convert_trial_to_basic(dict(row))
                converted_count += 1
                print(f"Converted trial to basic for user {row['user_id']}")
            except Exception as e:
                print(f"Failed to convert trial for user {row['user_id']}: {str(e)}")
                continue
                
    finally:
        await conn.close()
    
    return converted_count

async def convert_trial_to_basic(subscription_row) -> bool:
    """Convert a single trial subscription to Basic plan (€35/mo).
    
    This function is called after the trial period has ended to convert
    the user to a paid subscription. Billing starts immediately since
    the trial has already ended.
    """
    user_id = subscription_row['user_id']
    repo = PaymentRepository(user_id)
    
    # Get Basic plan
    basic_plan = await repo.get_subscription_plan_by_slug("basic")
    if not basic_plan:
        raise Exception("Basic plan not found")
    
    # Get current subscription
    subscription = await repo.get_user_subscription()
    if not subscription or not subscription.stripe_customer_id:
        raise Exception("Invalid subscription or missing Stripe customer")
    
    try:
        # Create Stripe subscription for Basic plan
        # If Basic plan doesn't have Stripe price ID, create it dynamically
        if basic_plan.stripe_price_id_monthly:
            price_id = basic_plan.stripe_price_id_monthly
        else:
            # Create Stripe price dynamically
            price = stripe.Price.create(
                unit_amount=int(basic_plan.price_monthly * 100),  # Convert to cents
                currency="eur",
                recurring={"interval": "month"},
                product_data={
                    "name": f"PayFlow Pro {basic_plan.name}",
                    "description": basic_plan.description or f"PayFlow Pro {basic_plan.name} Plan"
                },
            )
            price_id = price.id
        
        # Calculate when billing should start (after original trial period)
        original_trial_end = subscription_row.get('trial_end_date')
        if isinstance(original_trial_end, str):
            from datetime import datetime as dt
            original_trial_end = dt.fromisoformat(original_trial_end.replace('Z', '+00:00'))
        
        # If trial just ended, start billing immediately. Otherwise start at trial end time.
        now = datetime.now(timezone.utc)
        billing_start_time = max(now, original_trial_end) if original_trial_end else now
        
        stripe_subscription = stripe.Subscription.create(
            customer=subscription.stripe_customer_id,
            items=[{
                'price': price_id,
            }],
            metadata={
                'user_id': user_id,
                'plan_slug': 'basic',
                'billing_cycle': 'monthly',
                'converted_from_trial': 'true',
                'original_trial_end': original_trial_end.isoformat() if original_trial_end else None
            },
            # Start billing at the calculated time (usually now since conversion runs after trial ends)
            billing_cycle_anchor=int(billing_start_time.timestamp())
        )
        
        # Update local subscription - Convert from trial to active billing
        now = datetime.now(timezone.utc)
        subscription.plan_id = basic_plan.id
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.stripe_subscription_id = stripe_subscription.id
        
        # Clear trial dates and set billing period dates from Stripe
        subscription.trial_start_date = None
        subscription.trial_end_date = None
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start, timezone.utc)
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end, timezone.utc)
        subscription.updated_at = now
        
        print(f"Trial converted to active subscription for user {user_id}:")
        print(f"  - Billing period: {subscription.current_period_start} to {subscription.current_period_end}")
        print(f"  - Original trial ended: {original_trial_end}")
        print(f"  - Billing started: {billing_start_time}")
        
        await repo.update_user_subscription(subscription)
        
        # Create billing history record only if payment was actually processed
        # (Stripe will charge immediately if billing_cycle_anchor is in the past)
        billing_record = BillingHistory(
            id=uuid4(),
            user_id=user_id,
            subscription_id=subscription.id,
            amount=basic_plan.price_monthly,
            currency="EUR",
            status=BillingStatus.SUCCEEDED,
            billing_reason=BillingReason.SUBSCRIPTION_CREATE,
            period_start=subscription.current_period_start,
            period_end=subscription.current_period_end,
            paid_at=now,
            created_at=now
        )
        await repo.create_billing_history(billing_record)
        
        return True
        
    except stripe.error.StripeError as e:
        print(f"Stripe error converting trial for user {user_id}: {str(e)}")
        # If payment fails, mark subscription as past due instead of canceling
        subscription.status = SubscriptionStatus.PAST_DUE
        subscription.updated_at = datetime.now(timezone.utc)
        await repo.update_user_subscription(subscription)
        raise e

async def handle_checkout_completed(session):
    """Handle successful checkout session completion."""
    user_id = session['metadata'].get('user_id')
    plan_slug = session['metadata'].get('plan_slug')
    billing_cycle = session['metadata'].get('billing_cycle', 'monthly')
    
    if not user_id or not plan_slug:
        print(f"Missing metadata in checkout session: {session['id']}")
        return
    
    repo = PaymentRepository(user_id)
    
    # Get current subscription and target plan
    subscription = await repo.get_user_subscription()
    target_plan = await repo.get_subscription_plan_by_slug(plan_slug)
    
    if not subscription or not target_plan:
        print(f"Subscription or plan not found for user {user_id}")
        return
    
    # Get Stripe subscription details
    stripe_subscription_id = session.get('subscription')
    if stripe_subscription_id:
        stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
        
        # Update subscription with Stripe details
        now = datetime.now(timezone.utc)
        subscription.plan_id = target_plan.id
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.stripe_customer_id = session['customer']
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start, timezone.utc)
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end, timezone.utc)
        subscription.updated_at = now
        
        # Get payment method details and attach to customer as default
        if stripe_subscription.default_payment_method:
            payment_method = stripe.PaymentMethod.retrieve(stripe_subscription.default_payment_method)
            
            # Attach payment method to customer if not already attached
            if payment_method.customer != session['customer']:
                stripe.PaymentMethod.attach(
                    stripe_subscription.default_payment_method,
                    customer=session['customer']
                )
            
            # Set as default payment method for customer
            stripe.Customer.modify(
                session['customer'],
                invoice_settings={'default_payment_method': stripe_subscription.default_payment_method}
            )
            
            print(f"Payment method {stripe_subscription.default_payment_method} set as default for customer {session['customer']}")
            
            # Store card details in subscription record
            if payment_method.card:
                subscription.card_last_four = payment_method.card.last4
                subscription.card_brand = payment_method.card.brand
        
        await repo.update_user_subscription(subscription)
        
        # Create billing history record
        amount = stripe_subscription.items.data[0].price.unit_amount / 100  # Convert from cents
        billing_record = BillingHistory(
            id=uuid4(),
            user_id=user_id,
            subscription_id=subscription.id,
            amount=Decimal(str(amount)),
            currency="EUR",
            status=BillingStatus.SUCCEEDED,
            billing_reason=BillingReason.SUBSCRIPTION_CREATE,
            period_start=subscription.current_period_start,
            period_end=subscription.current_period_end,
            paid_at=now,
            created_at=now
        )
        await repo.create_billing_history(billing_record)
        
        print(f"Subscription upgraded for user {user_id} to {plan_slug}")

async def handle_subscription_updated(stripe_subscription):
    """Handle subscription updates from Stripe."""
    user_id = stripe_subscription['metadata'].get('user_id')
    
    if not user_id:
        print(f"No user_id in subscription metadata: {stripe_subscription['id']}")
        return
    
    repo = PaymentRepository(user_id)
    subscription = await repo.get_user_subscription()
    
    if not subscription:
        print(f"Local subscription not found for user {user_id}")
        return
    
    # Update subscription status and period
    now = datetime.now(timezone.utc)
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription['current_period_start'], timezone.utc)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription['current_period_end'], timezone.utc)
    subscription.cancel_at_period_end = stripe_subscription.get('cancel_at_period_end', False)
    subscription.updated_at = now
    
    # Handle status changes
    stripe_status = stripe_subscription['status']
    if stripe_status == 'active':
        subscription.status = SubscriptionStatus.ACTIVE
    elif stripe_status == 'canceled':
        subscription.status = SubscriptionStatus.CANCELED
        subscription.canceled_at = now
    elif stripe_status == 'past_due':
        subscription.status = SubscriptionStatus.PAST_DUE
    
    await repo.update_user_subscription(subscription)
    print(f"Subscription updated for user {user_id}: {stripe_status}")

async def handle_subscription_deleted(stripe_subscription):
    """Handle subscription cancellation from Stripe."""
    user_id = stripe_subscription['metadata'].get('user_id')
    
    if not user_id:
        print(f"No user_id in subscription metadata: {stripe_subscription['id']}")
        return
    
    repo = PaymentRepository(user_id)
    subscription = await repo.get_user_subscription()
    
    if not subscription:
        print(f"Local subscription not found for user {user_id}")
        return
    
    # Cancel subscription
    now = datetime.now(timezone.utc)
    subscription.status = SubscriptionStatus.CANCELED
    subscription.canceled_at = now
    subscription.updated_at = now
    
    await repo.update_user_subscription(subscription)
    print(f"Subscription canceled for user {user_id}")

async def handle_payment_succeeded(invoice):
    """Handle successful payment."""
    stripe_subscription_id = invoice.get('subscription')
    if not stripe_subscription_id:
        return
    
    # Find subscription by Stripe ID
    # Note: This would require adding a method to find subscription by stripe_subscription_id
    print(f"Payment succeeded for subscription {stripe_subscription_id}")

async def handle_payment_failed(invoice):
    """Handle failed payment."""
    stripe_subscription_id = invoice.get('subscription')
    if not stripe_subscription_id:
        return
    
    # Handle failed payment - could send notification, update status, etc.
    print(f"Payment failed for subscription {stripe_subscription_id}")
