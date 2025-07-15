import stripe
import json
from typing import Optional, Dict, Any
from datetime import datetime
from app.libs.fee_calculator import calculate_transaction_fees
import asyncpg
import databutton as db
from app.env import mode, Mode

class StripeWebhookProcessor:
    """Process Stripe webhooks and extract transaction fee information."""
    
    def __init__(self):
        self.db_url = (
            db.secrets.get("DATABASE_URL_DEV")
            if mode == Mode.DEV
            else db.secrets.get("DATABASE_URL_PROD")
        )
    
    async def process_payment_intent_succeeded(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process payment_intent.succeeded webhook to extract fee information.
        
        Args:
            event_data: Stripe webhook event data
            
        Returns:
            Fee information dictionary or None if processing fails
        """
        try:
            payment_intent = event_data['data']['object']
            
            # Extract key information
            payment_intent_id = payment_intent['id']
            amount = payment_intent['amount'] / 100  # Convert from cents to EUR
            currency = payment_intent['currency']
            
            if currency != 'eur':
                print(f"Skipping non-EUR payment: {currency}")
                return None
                
            # Get the charge to extract fees
            charges = stripe.Charge.list(payment_intent=payment_intent_id, limit=1)
            
            if not charges.data:
                print(f"No charges found for payment intent {payment_intent_id}")
                return None
                
            charge = charges.data[0]
            
            # Extract Stripe fees from balance transaction
            if not charge.balance_transaction:
                print(f"No balance transaction found for charge {charge.id}")
                return None
                
            balance_transaction = stripe.BalanceTransaction.retrieve(charge.balance_transaction)
            
            # Calculate Stripe fee from balance transaction
            stripe_fee = 0
            for fee_detail in balance_transaction.fee_details:
                if fee_detail.type == 'stripe_fee':
                    stripe_fee += fee_detail.amount
                    
            stripe_fee_eur = stripe_fee / 100  # Convert from cents to EUR
            
            # Find associated invoice and user
            invoice_info = await self._find_invoice_for_payment_intent(payment_intent_id)
            
            if not invoice_info:
                print(f"No invoice found for payment intent {payment_intent_id}")
                return None
                
            # Get user's subscription plan
            user_plan = await self._get_user_subscription_plan(invoice_info['user_id'])
            
            if not user_plan:
                print(f"No subscription plan found for user {invoice_info['user_id']}")
                return None
                
            # Calculate our fees
            fee_calculation = calculate_transaction_fees(amount, user_plan['slug'])
            
            # Return fee information for processing
            return {
                'payment_intent_id': payment_intent_id,
                'charge_id': charge.id,
                'invoice_id': invoice_info['invoice_id'],
                'payment_id': invoice_info['payment_id'],
                'user_id': invoice_info['user_id'],
                'payment_amount': amount,
                'stripe_fee_amount': stripe_fee_eur,
                'our_markup_percentage': float(fee_calculation['our_markup_percentage']),
                'our_markup_amount': float(fee_calculation['our_markup_amount']),
                'total_fee_amount': float(fee_calculation['total_fee']),
                'subscription_plan_slug': user_plan['slug'],
                'processed_at': datetime.now()
            }
            
        except Exception as e:
            print(f"Error processing payment_intent.succeeded webhook: {str(e)}")
            return None
    
    async def _find_invoice_for_payment_intent(self, payment_intent_id: str) -> Optional[Dict[str, str]]:
        """Find the invoice and payment associated with a Stripe payment intent."""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            # Look for payment with this Stripe payment intent ID
            query = """
                SELECT p.id as payment_id, p.invoice_id, i.user_id
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                WHERE p.stripe_payment_intent_id = $1
            """
            
            result = await conn.fetchrow(query, payment_intent_id)
            
            if result:
                return {
                    'payment_id': str(result['payment_id']),
                    'invoice_id': str(result['invoice_id']),
                    'user_id': result['user_id']
                }
                
            return None
            
        finally:
            await conn.close()
    
    async def _get_user_subscription_plan(self, user_id: str) -> Optional[Dict[str, str]]:
        """Get the user's current subscription plan."""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            query = """
                SELECT sp.slug, sp.name
                FROM user_subscriptions us
                JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
                WHERE us.user_id = $1 AND us.is_active = true
                ORDER BY us.created_at DESC
                LIMIT 1
            """
            
            result = await conn.fetchrow(query, user_id)
            
            if result:
                return {
                    'slug': result['slug'],
                    'name': result['name']
                }
                
            return None
            
        finally:
            await conn.close()
    
    async def record_transaction_fee(self, fee_info: Dict[str, Any]) -> bool:
        """Record transaction fee in the database."""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            # Check if fee already recorded
            existing_query = "SELECT id FROM transaction_fees WHERE stripe_payment_intent_id = $1"
            existing = await conn.fetchrow(existing_query, fee_info['payment_intent_id'])
            
            if existing:
                print(f"Transaction fee already recorded for payment intent {fee_info['payment_intent_id']}")
                return True
                
            # Insert new transaction fee record
            insert_query = """
                INSERT INTO transaction_fees (
                    user_id, invoice_id, payment_id, stripe_payment_intent_id, stripe_charge_id,
                    payment_amount, stripe_fee_amount, our_markup_percentage, our_markup_amount,
                    total_fee_amount, subscription_plan_slug, billing_month
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            """
            
            # Determine billing month (current month)
            from datetime import date
            billing_month = date.today().replace(day=1)
            
            await conn.execute(
                insert_query,
                fee_info['user_id'], fee_info['invoice_id'], fee_info['payment_id'],
                fee_info['payment_intent_id'], fee_info['charge_id'],
                fee_info['payment_amount'], fee_info['stripe_fee_amount'],
                fee_info['our_markup_percentage'], fee_info['our_markup_amount'],
                fee_info['total_fee_amount'], fee_info['subscription_plan_slug'],
                billing_month
            )
            
            print(f"Recorded transaction fee: €{fee_info['total_fee_amount']} for payment {fee_info['payment_intent_id']}")
            return True
            
        except Exception as e:
            print(f"Error recording transaction fee: {str(e)}")
            return False
            
        finally:
            await conn.close()