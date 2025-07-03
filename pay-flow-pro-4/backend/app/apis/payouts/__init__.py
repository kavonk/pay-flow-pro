from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import stripe
import databutton as db
from app.auth import AuthorizedUser

router = APIRouter(prefix="/payouts")

# Initialize Stripe
stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")

# Pydantic Models
class SettlementSummary(BaseModel):
    total_pending_balance: float
    total_available_balance: float
    last_payout_amount: Optional[float]
    last_payout_date: Optional[datetime]

class Transfer(BaseModel):
    id: str
    amount: float
    currency: str
    status: str
    arrival_date: datetime
    created: datetime
    description: Optional[str]

class InstantPayoutRequest(BaseModel):
    amount: int # Amount in cents
    currency: str

class InstantPayoutResponse(BaseModel):
    id: str
    status: str
    message: str

@router.get("/settlement-summary", response_model=SettlementSummary)
async def get_payouts_settlement_summary(user: AuthorizedUser):
    try:
        balance = stripe.Balance.retrieve()
        
        available_balance = sum(b.amount for b in balance.available) / 100
        pending_balance = sum(b.amount for b in balance.pending) / 100

        # Get last payout
        last_payout = stripe.Payout.list(limit=1)
        last_payout_amount = None
        last_payout_date = None
        if last_payout.data:
            payout = last_payout.data[0]
            last_payout_amount = payout.amount / 100
            last_payout_date = datetime.fromtimestamp(payout.created)

        return SettlementSummary(
            total_pending_balance=pending_balance,
            total_available_balance=available_balance,
            last_payout_amount=last_payout_amount,
            last_payout_date=last_payout_date,
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

@router.get("/transfers", response_model=List[Transfer])
async def get_payouts_transfers(user: AuthorizedUser, limit: int = 10):
    try:
        payouts = stripe.Payout.list(limit=limit)
        transfers = [
            Transfer(
                id=p.id,
                amount=p.amount / 100,
                currency=p.currency,
                status=p.status,
                arrival_date=datetime.fromtimestamp(p.arrival_date),
                created=datetime.fromtimestamp(p.created),
                description=p.description,
            )
            for p in payouts.data
        ]
        return transfers
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/instant-payout", response_model=InstantPayoutResponse)
async def create_payouts_instant_payout(request: InstantPayoutRequest, user: AuthorizedUser):
    try:
        payout = stripe.Payout.create(
            amount=request.amount,
            currency=request.currency,
            method="instant",
        )
        return InstantPayoutResponse(
            id=payout.id,
            status=payout.status,
            message="Instant payout initiated successfully."
        )
    except stripe.error.InvalidRequestError as e:
        # Handle cases where instant payout is not available
        if "Instant payouts are not available" in str(e):
            raise HTTPException(status_code=400, detail="Instant payouts are not available for this account.") from e
        raise HTTPException(status_code=400, detail=str(e)) from e
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
class Payout(BaseModel):
    id: str
    amount: float
    currency: str
    status: str
    arrival_date: datetime
    created: datetime
    description: Optional[str]
    method: str

@router.get("/payouts", response_model=List[Payout])
async def get_payouts_history(user: AuthorizedUser, limit: int = 10):
    try:
        payouts = stripe.Payout.list(limit=limit)
        return [
            Payout(
                id=p.id,
                amount=p.amount / 100,
                currency=p.currency,
                status=p.status,
                arrival_date=datetime.fromtimestamp(p.arrival_date),
                created=datetime.fromtimestamp(p.created),
                description=p.description,
                method=p.method,
            )
            for p in payouts.data
        ]
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

