from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
import asyncpg
import databutton as db
import uuid
from app.auth import AuthorizedUser
from app.env import mode, Mode

router = APIRouter(prefix="/transaction-fees")

# Database connection
async def get_db_connection():
    database_url = (
        db.secrets.get("DATABASE_URL_DEV")
        if mode == Mode.DEV
        else db.secrets.get("DATABASE_URL_PROD")
    )
    return await asyncpg.connect(database_url)

# Pydantic models
class TransactionFeeRecord(BaseModel):
    id: str
    invoice_id: str
    payment_id: str
    stripe_payment_intent_id: Optional[str]
    payment_amount: float
    stripe_fee_amount: float
    our_markup_percentage: float
    our_markup_amount: float
    total_fee_amount: float
    subscription_plan_slug: str
    processed_at: datetime
    billing_month: date
    billed_at: Optional[datetime]
    
class MonthlyFeeBilling(BaseModel):
    id: str
    billing_month: date
    total_payment_volume: float
    total_stripe_fees: float
    total_our_markup: float
    total_fee_amount: float
    transaction_count: int
    subscription_plan_slug: str
    billing_status: str
    created_at: datetime
    billed_at: Optional[datetime]
    paid_at: Optional[datetime]

class CreateTransactionFeeRequest(BaseModel):
    invoice_id: str
    payment_id: str
    stripe_payment_intent_id: Optional[str]
    stripe_charge_id: Optional[str]
    payment_amount: float
    stripe_fee_amount: float
    subscription_plan_slug: str
    
    @validator('invoice_id')
    def validate_invoice_id(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('invoice_id must be a valid UUID')
            
    @validator('payment_id')
    def validate_payment_id(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('payment_id must be a valid UUID')

class MonthlyFeeCalculationResponse(BaseModel):
    billing_month: date
    total_payment_volume: float
    total_stripe_fees: float
    total_our_markup: float
    total_fee_amount: float
    transaction_count: int
    can_bill: bool
    reason: Optional[str]

@router.post("/record-fee", response_model=TransactionFeeRecord)
async def record_transaction_fee(request: CreateTransactionFeeRequest, user: AuthorizedUser):
    """Record a transaction fee for a processed payment."""
    conn = await get_db_connection()
    
    try:
        # Get user's current subscription plan to determine markup
        plan_query = """
            SELECT sp.slug, sp.transaction_fee_percentage
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = $1 AND us.status IN ('active', 'trial')
            ORDER BY us.created_at DESC
            LIMIT 1
        """
        plan_result = await conn.fetchrow(plan_query, user.sub)
        
        if not plan_result:
            raise HTTPException(status_code=404, detail="No active subscription found")
            
        markup_percentage = float(plan_result['transaction_fee_percentage'])
        
        # Calculate our markup amount
        our_markup_amount = float(request.payment_amount) * markup_percentage
        total_fee_amount = request.stripe_fee_amount + our_markup_amount
        
        # Determine billing month (current month)
        billing_month = date.today().replace(day=1)
        
        # Insert transaction fee record
        insert_query = """
            INSERT INTO transaction_fees (
                user_id, invoice_id, payment_id, stripe_payment_intent_id, stripe_charge_id,
                payment_amount, stripe_fee_amount, our_markup_percentage, our_markup_amount,
                total_fee_amount, subscription_plan_slug, billing_month
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        """
        
        result = await conn.fetchrow(
            insert_query,
            user.sub, request.invoice_id, request.payment_id,
            request.stripe_payment_intent_id, request.stripe_charge_id,
            request.payment_amount, request.stripe_fee_amount,
            markup_percentage, our_markup_amount, total_fee_amount,
            request.subscription_plan_slug, billing_month
        )
        
        return TransactionFeeRecord(
            id=str(result['id']),
            invoice_id=str(result['invoice_id']),
            payment_id=str(result['payment_id']),
            stripe_payment_intent_id=result['stripe_payment_intent_id'],
            payment_amount=float(result['payment_amount']),
            stripe_fee_amount=float(result['stripe_fee_amount']),
            our_markup_percentage=float(result['our_markup_percentage']),
            our_markup_amount=float(result['our_markup_amount']),
            total_fee_amount=float(result['total_fee_amount']),
            subscription_plan_slug=result['subscription_plan_slug'],
            processed_at=result['processed_at'],
            billing_month=result['billing_month'],
            billed_at=result['billed_at']
        )
        
    finally:
        await conn.close()

@router.get("/monthly-calculation/{year}/{month}", response_model=MonthlyFeeCalculationResponse)
async def calculate_monthly_fees(year: int, month: int, user: AuthorizedUser):
    """Calculate monthly transaction fees for a specific month."""
    conn = await get_db_connection()
    
    try:
        billing_month = date(year, month, 1)
        
        # Calculate monthly totals
        calc_query = """
            SELECT 
                COUNT(*) as transaction_count,
                SUM(payment_amount) as total_payment_volume,
                SUM(stripe_fee_amount) as total_stripe_fees,
                SUM(our_markup_amount) as total_our_markup,
                SUM(total_fee_amount) as total_fee_amount,
                subscription_plan_slug
            FROM transaction_fees
            WHERE user_id = $1 AND billing_month = $2 AND billed_at IS NULL
            GROUP BY subscription_plan_slug
        """
        
        result = await conn.fetchrow(calc_query, user.sub, billing_month)
        
        if not result or result['transaction_count'] == 0:
            return MonthlyFeeCalculationResponse(
                billing_month=billing_month,
                total_payment_volume=0.0,
                total_stripe_fees=0.0,
                total_our_markup=0.0,
                total_fee_amount=0.0,
                transaction_count=0,
                can_bill=False,
                reason="No transactions found for this month"
            )
            
        # Check if already billed
        existing_query = """
            SELECT id FROM monthly_fee_billings 
            WHERE user_id = $1 AND billing_month = $2
        """
        existing = await conn.fetchrow(existing_query, user.sub, billing_month)
        
        can_bill = existing is None and float(result['total_fee_amount']) > 0
        reason = None if can_bill else "Already billed" if existing else "No fees to bill"
        
        return MonthlyFeeCalculationResponse(
            billing_month=billing_month,
            total_payment_volume=float(result['total_payment_volume'] or 0),
            total_stripe_fees=float(result['total_stripe_fees'] or 0),
            total_our_markup=float(result['total_our_markup'] or 0),
            total_fee_amount=float(result['total_fee_amount'] or 0),
            transaction_count=int(result['transaction_count']),
            can_bill=can_bill,
            reason=reason
        )
        
    finally:
        await conn.close()

@router.get("/monthly-billings", response_model=List[MonthlyFeeBilling])
async def get_monthly_billings(user: AuthorizedUser, limit: int = 12):
    """Get monthly fee billing history for the user."""
    conn = await get_db_connection()
    
    try:
        query = """
            SELECT * FROM monthly_fee_billings
            WHERE user_id = $1
            ORDER BY billing_month DESC
            LIMIT $2
        """
        
        results = await conn.fetch(query, user.sub, limit)
        
        return [
            MonthlyFeeBilling(
                id=str(row['id']),
                billing_month=row['billing_month'],
                total_payment_volume=float(row['total_payment_volume']),
                total_stripe_fees=float(row['total_stripe_fees']),
                total_our_markup=float(row['total_our_markup']),
                total_fee_amount=float(row['total_fee_amount']),
                transaction_count=int(row['transaction_count']),
                subscription_plan_slug=row['subscription_plan_slug'],
                billing_status=row['billing_status'],
                created_at=row['created_at'],
                billed_at=row['billed_at'],
                paid_at=row['paid_at']
            )
            for row in results
        ]
        
    finally:
        await conn.close()

@router.get("/current-month-preview", response_model=MonthlyFeeCalculationResponse)
async def get_current_month_fees_preview(user: AuthorizedUser):
    """Get preview of current month's transaction fees."""
    current_date = date.today()
    return await calculate_monthly_fees(current_date.year, current_date.month, user)

@router.get("/unbilled-fees", response_model=List[TransactionFeeRecord])
async def get_unbilled_fees(user: AuthorizedUser):
    """Get all unbilled transaction fees for the user."""
    conn = await get_db_connection()
    
    try:
        query = """
            SELECT * FROM transaction_fees
            WHERE user_id = $1 AND billed_at IS NULL
            ORDER BY processed_at DESC
        """
        
        results = await conn.fetch(query, user.sub)
        
        return [
            TransactionFeeRecord(
                id=str(row['id']),
                invoice_id=str(row['invoice_id']),
                payment_id=str(row['payment_id']),
                stripe_payment_intent_id=row['stripe_payment_intent_id'],
                payment_amount=float(row['payment_amount']),
                stripe_fee_amount=float(row['stripe_fee_amount']),
                our_markup_percentage=float(row['our_markup_percentage']),
                our_markup_amount=float(row['our_markup_amount']),
                total_fee_amount=float(row['total_fee_amount']),
                subscription_plan_slug=row['subscription_plan_slug'],
                processed_at=row['processed_at'],
                billing_month=row['billing_month'],
                billed_at=row['billed_at']
            )
            for row in results
        ]
        
    finally:
        await conn.close()