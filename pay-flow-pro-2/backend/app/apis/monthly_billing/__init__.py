from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.env import mode, Mode
from app.libs.fee_calculator import calculate_monthly_fee_summary

router = APIRouter(prefix="/monthly-billing")

# Database connection
async def get_db_connection():
    database_url = (
        db.secrets.get("DATABASE_URL_DEV")
        if mode == Mode.DEV
        else db.secrets.get("DATABASE_URL_PROD")
    )
    return await asyncpg.connect(database_url)

# Pydantic models
class MonthlyFeeSummary(BaseModel):
    billing_month: date
    total_payment_volume: float
    total_stripe_fees: float
    total_our_markup: float
    total_fee_amount: float
    transaction_count: int
    average_fee_rate: float
    billing_status: str
    billed_at: Optional[datetime]
    paid_at: Optional[datetime]

class TransactionFeeDetail(BaseModel):
    invoice_id: str
    payment_amount: float
    stripe_fee_amount: float
    our_markup_amount: float
    total_fee_amount: float
    processed_at: datetime
    customer_name: Optional[str]
    invoice_number: Optional[str]

class MonthlyBillingDetails(BaseModel):
    summary: MonthlyFeeSummary
    transactions: List[TransactionFeeDetail]

@router.get("/summary", response_model=List[MonthlyFeeSummary])
async def get_monthly_billing_summary(user: AuthorizedUser, limit: int = 12):
    """Get monthly billing summary for the last N months."""
    conn = await get_db_connection()
    
    try:
        query = """
            SELECT 
                billing_month,
                total_payment_volume,
                total_stripe_fees,
                total_our_markup,
                total_fee_amount,
                transaction_count,
                billing_status,
                billed_at,
                paid_at
            FROM monthly_fee_billings
            WHERE user_id = $1
            ORDER BY billing_month DESC
            LIMIT $2
        """
        
        results = await conn.fetch(query, user.sub, limit)
        
        summaries = []
        for row in results:
            # Calculate average fee rate
            avg_rate = 0.0
            if row['total_payment_volume'] and row['total_payment_volume'] > 0:
                avg_rate = (row['total_fee_amount'] / row['total_payment_volume']) * 100
                
            summaries.append(MonthlyFeeSummary(
                billing_month=row['billing_month'],
                total_payment_volume=float(row['total_payment_volume']),
                total_stripe_fees=float(row['total_stripe_fees']),
                total_our_markup=float(row['total_our_markup']),
                total_fee_amount=float(row['total_fee_amount']),
                transaction_count=int(row['transaction_count']),
                average_fee_rate=round(avg_rate, 2),
                billing_status=row['billing_status'],
                billed_at=row['billed_at'],
                paid_at=row['paid_at']
            ))
            
        return summaries
        
    finally:
        await conn.close()

@router.get("/details/{year}/{month}", response_model=MonthlyBillingDetails)
async def get_monthly_billing_details(year: int, month: int, user: AuthorizedUser):
    """Get detailed monthly billing information for a specific month."""
    conn = await get_db_connection()
    
    try:
        billing_month = date(year, month, 1)
        
        # Get summary
        summary_query = """
            SELECT 
                billing_month,
                total_payment_volume,
                total_stripe_fees,
                total_our_markup,
                total_fee_amount,
                transaction_count,
                billing_status,
                billed_at,
                paid_at
            FROM monthly_fee_billings
            WHERE user_id = $1 AND billing_month = $2
        """
        
        summary_result = await conn.fetchrow(summary_query, user.sub, billing_month)
        
        if not summary_result:
            raise HTTPException(status_code=404, detail="No billing data found for this month")
            
        # Calculate average fee rate
        avg_rate = 0.0
        if summary_result['total_payment_volume'] and summary_result['total_payment_volume'] > 0:
            avg_rate = (summary_result['total_fee_amount'] / summary_result['total_payment_volume']) * 100
            
        summary = MonthlyFeeSummary(
            billing_month=summary_result['billing_month'],
            total_payment_volume=float(summary_result['total_payment_volume']),
            total_stripe_fees=float(summary_result['total_stripe_fees']),
            total_our_markup=float(summary_result['total_our_markup']),
            total_fee_amount=float(summary_result['total_fee_amount']),
            transaction_count=int(summary_result['transaction_count']),
            average_fee_rate=round(avg_rate, 2),
            billing_status=summary_result['billing_status'],
            billed_at=summary_result['billed_at'],
            paid_at=summary_result['paid_at']
        )
        
        # Get transaction details
        details_query = """
            SELECT 
                tf.invoice_id,
                tf.payment_amount,
                tf.stripe_fee_amount,
                tf.our_markup_amount,
                tf.total_fee_amount,
                tf.processed_at,
                c.name as customer_name,
                i.invoice_number
            FROM transaction_fees tf
            JOIN invoices i ON tf.invoice_id = i.id
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE tf.user_id = $1 AND tf.billing_month = $2
            ORDER BY tf.processed_at DESC
        """
        
        transaction_results = await conn.fetch(details_query, user.sub, billing_month)
        
        transactions = [
            TransactionFeeDetail(
                invoice_id=str(row['invoice_id']),
                payment_amount=float(row['payment_amount']),
                stripe_fee_amount=float(row['stripe_fee_amount']),
                our_markup_amount=float(row['our_markup_amount']),
                total_fee_amount=float(row['total_fee_amount']),
                processed_at=row['processed_at'],
                customer_name=row['customer_name'],
                invoice_number=row['invoice_number']
            )
            for row in transaction_results
        ]
        
        return MonthlyBillingDetails(
            summary=summary,
            transactions=transactions
        )
        
    finally:
        await conn.close()

@router.get("/current-month-preview", response_model=MonthlyFeeSummary)
async def get_current_month_preview(user: AuthorizedUser):
    """Get preview of current month's unbilled transaction fees."""
    conn = await get_db_connection()
    
    try:
        current_month = date.today().replace(day=1)
        
        # Get unbilled transactions for current month
        query = """
            SELECT 
                payment_amount,
                stripe_fee_amount,
                our_markup_amount,
                total_fee_amount
            FROM transaction_fees
            WHERE user_id = $1 AND billing_month = $2 AND billed_at IS NULL
        """
        
        results = await conn.fetch(query, user.sub, current_month)
        
        if not results:
            return MonthlyFeeSummary(
                billing_month=current_month,
                total_payment_volume=0.0,
                total_stripe_fees=0.0,
                total_our_markup=0.0,
                total_fee_amount=0.0,
                transaction_count=0,
                average_fee_rate=0.0,
                billing_status="pending",
                billed_at=None,
                paid_at=None
            )
        
        # Convert to list of dictionaries for the calculator
        transactions = [
            {
                'payment_amount': float(row['payment_amount']),
                'stripe_fee_amount': float(row['stripe_fee_amount']),
                'our_markup_amount': float(row['our_markup_amount'])
            }
            for row in results
        ]
        
        summary = calculate_monthly_fee_summary(transactions)
        
        return MonthlyFeeSummary(
            billing_month=current_month,
            total_payment_volume=float(summary['total_payment_volume']),
            total_stripe_fees=float(summary['total_stripe_fees']),
            total_our_markup=float(summary['total_our_markup']),
            total_fee_amount=float(summary['total_fees']),
            transaction_count=summary['transaction_count'],
            average_fee_rate=float(summary['average_fee_rate']),
            billing_status="pending",
            billed_at=None,
            paid_at=None
        )
        
    finally:
        await conn.close()