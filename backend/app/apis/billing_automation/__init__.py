from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
import asyncpg
import stripe
import databutton as db
from app.auth import AuthorizedUser
from app.env import mode, Mode

router = APIRouter(prefix="/billing-automation")

# Initialize Stripe
stripe.api_key = db.secrets.get("STRIPE_SECRET_KEY")

# Database connection
async def get_db_connection():
    database_url = (
        db.secrets.get("DATABASE_URL_DEV")
        if mode == Mode.DEV
        else db.secrets.get("DATABASE_URL_PROD")
    )
    return await asyncpg.connect(database_url)

# Pydantic models
class MonthlyBillingJobResult(BaseModel):
    processed_users: int
    total_amount_billed: float
    successful_billings: int
    failed_billings: int
    errors: List[str]
    
class CreateMonthlyBillingRequest(BaseModel):
    billing_month: date
    force_rebill: bool = False

class MonthlyBillingResponse(BaseModel):
    success: bool
    billing_id: str
    stripe_invoice_id: Optional[str]
    amount_billed: float
    message: str

@router.post("/run-monthly-billing", response_model=MonthlyBillingJobResult)
async def run_monthly_billing_job(background_tasks: BackgroundTasks, user: AuthorizedUser):
    """
    Run monthly billing job for all users with unbilled transaction fees.
    This should typically be run on the 1st of each month.
    """
    # For security, this endpoint should only be accessible by admin users or via scheduled job
    # For now, we'll allow any authenticated user to trigger it for testing
    
    background_tasks.add_task(process_monthly_billing_for_all_users)
    
    return MonthlyBillingJobResult(
        processed_users=0,
        total_amount_billed=0.0,
        successful_billings=0,
        failed_billings=0,
        errors=["Job started in background. Check logs for results."]
    )

async def process_monthly_billing_for_all_users():
    """Background task to process monthly billing for all users."""
    conn = await get_db_connection()
    
    try:
        # Get the previous month for billing
        today = date.today()
        if today.month == 1:
            billing_month = date(today.year - 1, 12, 1)
        else:
            billing_month = date(today.year, today.month - 1, 1)
            
        print(f"Processing monthly billing for {billing_month}")
        
        # Get all users with unbilled transaction fees for the billing month
        users_query = """
            SELECT DISTINCT user_id, subscription_plan_slug
            FROM transaction_fees
            WHERE billing_month = $1 AND billed_at IS NULL
        """
        
        users = await conn.fetch(users_query, billing_month)
        print(f"Found {len(users)} users with unbilled fees")
        
        processed_count = 0
        successful_count = 0
        failed_count = 0
        total_billed = 0.0
        
        for user_row in users:
            try:
                user_id = user_row['user_id']
                result = await create_monthly_billing_for_user(user_id, billing_month)
                
                if result['success']:
                    successful_count += 1
                    total_billed += result['amount_billed']
                    print(f"Successfully billed user {user_id}: €{result['amount_billed']}")
                else:
                    failed_count += 1
                    print(f"Failed to bill user {user_id}: {result['message']}")
                    
                processed_count += 1
                
            except Exception as e:
                failed_count += 1
                print(f"Error processing user {user_row['user_id']}: {str(e)}")
                
        print(f"Monthly billing complete: {processed_count} processed, {successful_count} successful, {failed_count} failed, €{total_billed} total")
        
    except Exception as e:
        print(f"Error in monthly billing job: {str(e)}")
    finally:
        await conn.close()

async def create_monthly_billing_for_user(user_id: str, billing_month: date) -> dict:
    """Create monthly billing for a specific user."""
    conn = await get_db_connection()
    
    try:
        # Check if already billed
        existing_query = "SELECT id FROM monthly_fee_billings WHERE user_id = $1 AND billing_month = $2"
        existing = await conn.fetchrow(existing_query, user_id, billing_month)
        
        if existing:
            return {
                'success': False,
                'billing_id': str(existing['id']),
                'amount_billed': 0.0,
                'message': 'Already billed for this month'
            }
            
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
        
        result = await conn.fetchrow(calc_query, user_id, billing_month)
        
        if not result or result['transaction_count'] == 0:
            return {
                'success': False,
                'billing_id': '',
                'amount_billed': 0.0,
                'message': 'No unbilled transactions found'
            }
            
        total_fee_amount = float(result['total_fee_amount'])
        
        if total_fee_amount <= 0:
            return {
                'success': False,
                'billing_id': '',
                'amount_billed': 0.0,
                'message': 'No fees to bill'
            }
            
        # Get user's Stripe customer ID
        customer_query = """
            SELECT stripe_customer_id, email 
            FROM user_subscriptions us
            LEFT JOIN users u ON u.id = us.user_id
            WHERE us.user_id = $1 AND us.is_active = true
            ORDER BY us.created_at DESC LIMIT 1
        """
        
        customer_result = await conn.fetchrow(customer_query, user_id)
        
        if not customer_result or not customer_result['stripe_customer_id']:
            return {
                'success': False,
                'billing_id': '',
                'amount_billed': 0.0,
                'message': 'No Stripe customer found'
            }
            
        # Create Stripe invoice
        try:
            stripe_customer_id = customer_result['stripe_customer_id']
            
            # Create invoice item
            invoice_item = stripe.InvoiceItem.create(
                customer=stripe_customer_id,
                amount=int(total_fee_amount * 100),  # Convert to cents
                currency="eur",
                description=f"Transaction fees for {billing_month.strftime('%B %Y')}",
                metadata={
                    'user_id': user_id,
                    'billing_month': billing_month.isoformat(),
                    'transaction_count': str(result['transaction_count']),
                    'payment_volume': str(result['total_payment_volume'])
                }
            )
            
            # Create and finalize invoice
            invoice = stripe.Invoice.create(
                customer=stripe_customer_id,
                description=f"PayFlow Pro - Transaction Fees ({billing_month.strftime('%B %Y')})",
                metadata={
                    'type': 'transaction_fees',
                    'user_id': user_id,
                    'billing_month': billing_month.isoformat()
                }
            )
            
            # Finalize the invoice
            finalized_invoice = stripe.Invoice.finalize_invoice(invoice.id)
            
            # Create monthly billing record
            billing_insert = """
                INSERT INTO monthly_fee_billings (
                    user_id, billing_month, total_payment_volume, total_stripe_fees,
                    total_our_markup, total_fee_amount, transaction_count,
                    subscription_plan_slug, stripe_invoice_id, billing_status, billed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            """
            
            billing_result = await conn.fetchrow(
                billing_insert,
                user_id, billing_month, result['total_payment_volume'],
                result['total_stripe_fees'], result['total_our_markup'],
                result['total_fee_amount'], result['transaction_count'],
                result['subscription_plan_slug'], finalized_invoice.id,
                'invoiced', datetime.now()
            )
            
            billing_id = str(billing_result['id'])
            
            # Mark transaction fees as billed
            update_fees = """
                UPDATE transaction_fees 
                SET billed_at = $1, monthly_billing_id = $2
                WHERE user_id = $3 AND billing_month = $4 AND billed_at IS NULL
            """
            
            await conn.execute(update_fees, datetime.now(), billing_result['id'], user_id, billing_month)
            
            return {
                'success': True,
                'billing_id': billing_id,
                'stripe_invoice_id': finalized_invoice.id,
                'amount_billed': total_fee_amount,
                'message': f'Successfully billed €{total_fee_amount:.2f} for {result["transaction_count"]} transactions'
            }
            
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'billing_id': '',
                'amount_billed': 0.0,
                'message': f'Stripe error: {str(e)}'
            }
            
    except Exception as e:
        return {
            'success': False,
            'billing_id': '',
            'amount_billed': 0.0,
            'message': f'Database error: {str(e)}'
        }
    finally:
        await conn.close()

@router.post("/create-monthly-billing", response_model=MonthlyBillingResponse)
async def create_monthly_billing(request: CreateMonthlyBillingRequest, user: AuthorizedUser):
    """Create monthly billing for the current user for a specific month."""
    result = await create_monthly_billing_for_user(user.sub, request.billing_month)
    
    return MonthlyBillingResponse(
        success=result['success'],
        billing_id=result['billing_id'],
        stripe_invoice_id=result.get('stripe_invoice_id'),
        amount_billed=result['amount_billed'],
        message=result['message']
    )

@router.get("/health")
async def billing_automation_health_check():
    """Health check endpoint for the billing automation system."""
    return {"status": "healthy", "service": "billing_automation", "timestamp": datetime.now()}