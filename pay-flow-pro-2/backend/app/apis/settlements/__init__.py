from typing import Optional, List
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from decimal import Decimal
import stripe
import databutton as db

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.models import PayoutAccount, PayoutAccountStatus

# Initialize Stripe
stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")

router = APIRouter()

# Request/Response Models
class PayoutSchedule(BaseModel):
    frequency: str  # "daily", "weekly", "instant"
    enabled: bool = True
    minimum_amount: Optional[Decimal] = None
    day_of_week: Optional[int] = None  # For weekly (0=Monday, 6=Sunday)

class SettlementSummary(BaseModel):
    gross_amount: Decimal
    stripe_fees: Decimal
    platform_fees: Decimal
    net_amount: Decimal
    pending_transfers: int
    last_payout_date: Optional[str] = None
    next_payout_date: Optional[str] = None

class TransferRecord(BaseModel):
    id: str
    amount: Decimal
    currency: str
    status: str
    created_at: str
    description: Optional[str] = None

class PayoutRequest(BaseModel):
    amount: Optional[Decimal] = None  # If None, payout all available balance
    description: Optional[str] = None

class PayoutResponse(BaseModel):
    id: str
    amount: Decimal
    currency: str
    status: str
    arrival_date: Optional[str] = None
    description: Optional[str] = None
    created_at: str

@router.get("/settlement-summary", response_model=SettlementSummary)
async def get_settlement_summary(user: AuthorizedUser):
    """Get settlement summary with fee breakdown."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get user's payout account
        payout_account = await repo.get_payout_account()
        if not payout_account:
            return SettlementSummary(
                gross_amount=Decimal('0'),
                stripe_fees=Decimal('0'),
                platform_fees=Decimal('0'),
                net_amount=Decimal('0'),
                pending_transfers=0,
                last_payout_date=None,
                next_payout_date=None
            )
        
        # Check if payout account is active - if not, return empty settlement data
        if payout_account.account_status != PayoutAccountStatus.ACTIVE:
            return SettlementSummary(
                gross_amount=Decimal('0'),
                stripe_fees=Decimal('0'),
                platform_fees=Decimal('0'),
                net_amount=Decimal('0'),
                pending_transfers=0,
                last_payout_date=None,
                next_payout_date=None
            )
        
        # Get balance from Stripe
        try:
            balance = stripe.Balance.retrieve(
                stripe_account=payout_account.stripe_account_id
            )
            
            # Calculate totals from available balance
            total_available = sum(
                bal.amount for bal in balance.available 
                if bal.currency.upper() in ['EUR', 'USD', 'GBP']
            ) / 100  # Convert from cents
            
            # Get recent transfers to calculate fees
            transfers = stripe.Transfer.list(
                destination=payout_account.stripe_account_id,
                limit=100
            )
            
            # Calculate fee breakdown from recent transfers
            gross_amount = Decimal('0')
            total_fees = Decimal('0')
            
            for transfer in transfers.data:
                if transfer.created > (datetime.now(timezone.utc) - timedelta(days=30)).timestamp():
                    transfer_amount = Decimal(str(transfer.amount)) / 100
                    gross_amount += transfer_amount
                    
                    # Get application fee for this transfer
                    if hasattr(transfer, 'source_transaction'):
                        try:
                            charge = stripe.Charge.retrieve(transfer.source_transaction)
                            if charge.application_fee_amount:
                                total_fees += Decimal(str(charge.application_fee_amount)) / 100
                        except:
                            pass
            
            # Estimate fee breakdown (approximation)
            stripe_fees = total_fees * Decimal('0.75')  # ~75% of fees are Stripe's
            platform_fees = total_fees * Decimal('0.25')  # ~25% are platform fees
            net_amount = gross_amount - total_fees
            
            # Get last payout info
            payouts = stripe.Payout.list(
                limit=1,
                stripe_account=payout_account.stripe_account_id
            )
            
            last_payout_date = None
            if payouts.data:
                last_payout_date = datetime.fromtimestamp(
                    payouts.data[0].created, tz=timezone.utc
                ).isoformat()
            
            # Calculate next payout date (simplified - daily by default)
            next_payout_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            
            return SettlementSummary(
                gross_amount=gross_amount,
                stripe_fees=stripe_fees,
                platform_fees=platform_fees,
                net_amount=net_amount,
                pending_transfers=len([t for t in transfers.data if t.created > (datetime.now(timezone.utc) - timedelta(days=1)).timestamp()]),
                last_payout_date=last_payout_date,
                next_payout_date=next_payout_date
            )
            
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/transfers", response_model=List[TransferRecord])
async def get_transfers(user: AuthorizedUser, limit: int = 20):
    """Get recent transfers to connected account."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get user's payout account
        payout_account = await repo.get_payout_account()
        if not payout_account:
            raise HTTPException(status_code=404, detail="No payout account found")
        
        # Get transfers from Stripe
        transfers = stripe.Transfer.list(
            destination=payout_account.stripe_account_id,
            limit=limit
        )
        
        transfer_records = []
        for transfer in transfers.data:
            transfer_records.append(TransferRecord(
                id=transfer.id,
                amount=Decimal(str(transfer.amount)) / 100,
                currency=transfer.currency.upper(),
                status=transfer.status if hasattr(transfer, 'status') else 'completed',
                created_at=datetime.fromtimestamp(
                    transfer.created, tz=timezone.utc
                ).isoformat(),
                description=transfer.description
            ))
        
        return transfer_records
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/instant-payout", response_model=PayoutResponse)
async def create_instant_payout(request: PayoutRequest, user: AuthorizedUser):
    """Create an instant payout to connected account."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get user's payout account
        payout_account = await repo.get_payout_account()
        if not payout_account:
            raise HTTPException(status_code=404, detail="No payout account found")
        
        if payout_account.account_status != PayoutAccountStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Payout account is not active")
        
        # Get available balance
        balance = stripe.Balance.retrieve(
            stripe_account=payout_account.stripe_account_id
        )
        
        available_amount = 0
        currency = 'eur'
        for bal in balance.available:
            if bal.currency in ['eur', 'usd', 'gbp']:
                available_amount = bal.amount
                currency = bal.currency
                break
        
        if available_amount <= 0:
            raise HTTPException(status_code=400, detail="No funds available for payout")
        
        # Determine payout amount
        payout_amount = request.amount
        if payout_amount is None:
            payout_amount = Decimal(str(available_amount)) / 100
        else:
            payout_amount_cents = int(payout_amount * 100)
            if payout_amount_cents > available_amount:
                raise HTTPException(status_code=400, detail="Insufficient funds")
            available_amount = payout_amount_cents
        
        # Create payout
        payout = stripe.Payout.create(
            amount=available_amount,
            currency=currency,
            description=request.description or "Manual payout from PayFlow Pro",
            stripe_account=payout_account.stripe_account_id
        )
        
        return PayoutResponse(
            id=payout.id,
            amount=Decimal(str(payout.amount)) / 100,
            currency=payout.currency.upper(),
            status=payout.status,
            arrival_date=datetime.fromtimestamp(
                payout.arrival_date, tz=timezone.utc
            ).isoformat() if payout.arrival_date else None,
            description=payout.description,
            created_at=datetime.fromtimestamp(
                payout.created, tz=timezone.utc
            ).isoformat()
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/payouts", response_model=List[PayoutResponse])
async def get_payouts(user: AuthorizedUser, limit: int = 20):
    """Get recent payouts for connected account."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get user's payout account
        payout_account = await repo.get_payout_account()
        if not payout_account:
            raise HTTPException(status_code=404, detail="No payout account found")
        
        # Get payouts from Stripe
        payouts = stripe.Payout.list(
            limit=limit,
            stripe_account=payout_account.stripe_account_id
        )
        
        payout_records = []
        for payout in payouts.data:
            payout_records.append(PayoutResponse(
                id=payout.id,
                amount=Decimal(str(payout.amount)) / 100,
                currency=payout.currency.upper(),
                status=payout.status,
                arrival_date=datetime.fromtimestamp(
                    payout.arrival_date, tz=timezone.utc
                ).isoformat() if payout.arrival_date else None,
                description=payout.description,
                created_at=datetime.fromtimestamp(
                    payout.created, tz=timezone.utc
                ).isoformat()
            ))
        
        return payout_records
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
