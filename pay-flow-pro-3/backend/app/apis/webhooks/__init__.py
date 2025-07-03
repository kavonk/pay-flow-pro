from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal
import stripe
import json
import hmac
import hashlib
import databutton as db

from app.libs.repository import PaymentRepository
from app.libs.models import create_payment, InvoiceStatus, PaymentMethod, PayoutAccount, PayoutAccountStatus
from app.libs.webhook_processor import StripeWebhookProcessor

router = APIRouter(prefix="/webhooks")

# This API should be unprotected since Stripe calls it
# Signature verification provides the security

def verify_webhook_signature(payload: bytes, signature: str, webhook_secret: str) -> bool:
    """Verify Stripe webhook signature for security."""
    try:
        # Extract timestamp and signatures from header
        elements = signature.split(',')
        timestamp = None
        signatures = []
        
        for element in elements:
            key, value = element.split('=')
            if key == 't':
                timestamp = value
            elif key == 'v1':
                signatures.append(value)
        
        if not timestamp or not signatures:
            return False
        
        # Create expected signature
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return any(hmac.compare_digest(expected_signature, sig) for sig in signatures)
        
    except Exception as e:
        print(f"Webhook signature verification failed: {str(e)}")
        return False

# Request/Response models
class WebhookEventLog(BaseModel):
    id: str
    type: str
    created: datetime
    data: Dict[str, Any]
    processed: bool = False
    error: Optional[str] = None

class PaymentReconciliationRequest(BaseModel):
    invoice_id: UUID = Field(..., description="Invoice ID to reconcile")
    payment_amount: Decimal = Field(..., gt=0, description="Payment amount")
    payment_method: str = Field(..., description="Payment method (card, bank_transfer, etc.)")
    transaction_id: str = Field(..., description="External transaction ID")
    notes: Optional[str] = Field(None, description="Additional notes")

class PaymentReconciliationResponse(BaseModel):
    payment_id: UUID
    invoice_id: UUID
    amount: Decimal
    status: str
    message: str

@router.post("/stripe")
async def stripe_webhook_handler(request: Request, stripe_signature: str = Header(None, alias="stripe-signature")):
    """Handle Stripe webhook events for payment processing."""
    try:
        # Get raw body
        body = await request.body()
        
        # Verify webhook signature if secret is available
        webhook_secret = db.secrets.get("STRIPE_WEBHOOK_SECRET")
        if webhook_secret and stripe_signature:
            if not verify_webhook_signature(body, stripe_signature, webhook_secret):
                print("Webhook signature verification failed")
                raise HTTPException(status_code=401, detail="Invalid signature")
        elif webhook_secret:
            print("Webhook signature missing but secret configured")
            raise HTTPException(status_code=401, detail="Missing signature")
        else:
            print("Warning: Webhook secret not configured - proceeding without verification")
        
        # Parse the event
        try:
            event = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON")
        
        event_type = event.get('type')
        event_data = event.get('data', {}).get('object', {})
        
        print(f"Received Stripe webhook: {event_type}")
        
        # Log the webhook event
        webhook_log = {
            'event_id': event.get('id'),
            'event_type': event_type,
            'created': datetime.now().isoformat(),
            'data': event_data,
            'processed': False
        }
        
        # Handle payment success events
        if event_type in ['checkout.session.completed', 'payment_intent.succeeded', 'payment_link.payment.succeeded']:
            try:
                await process_payment_success(event_data)
                
                # Process transaction fees for payment_intent.succeeded events
                if event_type == 'payment_intent.succeeded':
                    await process_transaction_fees(event)
                    
                webhook_log['processed'] = True
                print(f"Successfully processed {event_type} event")
            except Exception as e:
                error_msg = f"Failed to process payment success: {str(e)}"
                webhook_log['error'] = error_msg
                print(error_msg)
                # Don't raise exception - return success to Stripe to avoid retries
        
        # Handle other relevant events
        elif event_type in ['payment_intent.payment_failed', 'invoice.payment_failed']:
            try:
                await process_payment_failure(event_data)
                webhook_log['processed'] = True
                print(f"Successfully processed {event_type} event")
            except Exception as e:
                error_msg = f"Failed to process payment failure: {str(e)}"
                webhook_log['error'] = error_msg
                print(error_msg)
        
        # Handle Connect account events
        elif event_type in ['account.updated', 'account.application.authorized']:
            try:
                await process_account_update(event_data)
                webhook_log['processed'] = True
                print(f"Successfully processed {event_type} event")
            except Exception as e:
                error_msg = f"Failed to process account update: {str(e)}"
                webhook_log['error'] = error_msg
                print(error_msg)
        
        else:
            print(f"Unhandled event type: {event_type}")
            webhook_log['processed'] = True  # Mark as processed even if we don't handle it
        
        # Log the event for audit purposes
        # In a production system, you'd want to store this in a database
        print(f"Webhook log: {json.dumps(webhook_log, indent=2)}")
        
        return {"status": "success", "message": "Webhook processed"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

async def process_transaction_fees(event: Dict[str, Any]):
    """Process transaction fees for payment_intent.succeeded events."""
    try:
        processor = StripeWebhookProcessor()
        
        # Extract fee information from the payment intent
        fee_info = await processor.process_payment_intent_succeeded(event)
        
        if fee_info:
            # Record the transaction fee
            success = await processor.record_transaction_fee(fee_info)
            
            if success:
                print(f"Successfully recorded transaction fee: €{fee_info['total_fee_amount']} for payment {fee_info['payment_intent_id']}")
            else:
                print(f"Failed to record transaction fee for payment {fee_info['payment_intent_id']}")
        else:
            print("No fee information extracted from payment intent")
            
    except Exception as e:
        print(f"Error processing transaction fees: {str(e)}")
        # Don't raise exception to avoid webhook retries

async def process_payment_success(payment_data: Dict[str, Any]):
    """Process successful payment and update invoice status."""
    try:
        # Extract payment information
        metadata = payment_data.get('metadata', {})
        invoice_id = metadata.get('invoice_id')
        user_id = metadata.get('user_id')
        
        if not invoice_id or not user_id:
            print("Missing invoice_id or user_id in payment metadata")
            return
        
        # Get payment amount
        amount_cents = payment_data.get('amount_total') or payment_data.get('amount')
        if not amount_cents:
            print("No amount found in payment data")
            return
        
        amount = Decimal(amount_cents) / 100  # Convert from cents
        currency = payment_data.get('currency', 'eur').upper()
        
        # Get payment method
        payment_method_details = payment_data.get('payment_method_types', ['card'])
        payment_method = payment_method_details[0] if payment_method_details else 'card'
        
        # Map Stripe payment method to our enum
        method_mapping = {
            'card': PaymentMethod.CARD,
            'sepa_debit': PaymentMethod.BANK_TRANSFER,
            'ach_debit': PaymentMethod.BANK_TRANSFER,
            'bank_transfer': PaymentMethod.BANK_TRANSFER
        }
        mapped_method = method_mapping.get(payment_method, PaymentMethod.OTHER)
        
        # Transaction ID
        transaction_id = payment_data.get('id') or payment_data.get('payment_intent')
        
        repo = PaymentRepository(user_id)
        
        # Get the invoice
        invoice = await repo.get_invoice(UUID(invoice_id))
        if not invoice:
            print(f"Invoice {invoice_id} not found")
            return
        
        # Check if payment already exists
        existing_payments = await repo.get_payments_for_invoice(UUID(invoice_id))
        for existing_payment in existing_payments:
            if existing_payment.transaction_id == transaction_id:
                print(f"Payment with transaction ID {transaction_id} already exists")
                return
        
        # Create payment record
        payment = create_payment(
            user_id=user_id,
            invoice_id=UUID(invoice_id),
            amount=amount,
            currency=currency,
            method=mapped_method,
            transaction_id=transaction_id,
            notes=f"Stripe payment via {payment_method}"
        )
        
        # Save payment
        created_payment = await repo.create_payment(payment)
        print(f"Created payment record: {created_payment.id}")
        
        # Update invoice status to paid
        invoice.status = InvoiceStatus.PAID
        updated_invoice = await repo.update_invoice(invoice)
        
        if updated_invoice:
            print(f"Updated invoice {invoice_id} status to PAID")
        else:
            print(f"Failed to update invoice {invoice_id} status")
            
        # Return payment info for fee processing
        return {
            'payment_id': str(created_payment.id),
            'invoice_id': invoice_id,
            'user_id': user_id,
            'amount': float(amount),
            'stripe_payment_intent_id': transaction_id
        }
        
    except Exception as e:
        print(f"Error processing payment success: {str(e)}")
        raise

async def process_payment_failure(payment_data: Dict[str, Any]):
    """Process failed payment events."""
    try:
        metadata = payment_data.get('metadata', {})
        invoice_id = metadata.get('invoice_id')
        user_id = metadata.get('user_id')
        
        if not invoice_id or not user_id:
            print("Missing invoice_id or user_id in payment failure metadata")
            return
        
        # Log the failure
        failure_reason = payment_data.get('last_payment_error', {}).get('message', 'Unknown error')
        print(f"Payment failed for invoice {invoice_id}: {failure_reason}")
        
        # You could add logic here to:
        # - Send notification to customer about failed payment
        # - Update invoice with failure information
        # - Trigger retry logic
        
    except Exception as e:
        print(f"Error processing payment failure: {str(e)}")
        raise

async def process_account_update(account_data: Dict[str, Any]):
    """Process Stripe Connect account update events."""
    try:
        account_id = account_data.get('id')
        if not account_id:
            print("No account ID found in account update event")
            return
        
        print(f"Processing account update for account: {account_id}")
        
        # Find the payout account by stripe_account_id
        # We need to iterate through all accounts to find the matching one
        # In a real system, you'd have a more efficient lookup
        
        # Get account data from Stripe to ensure we have the latest info
        import stripe
        stripe_account = stripe.Account.retrieve(account_id)
        
        # Extract requirements and status from the account
        requirements_currently_due = stripe_account.requirements.currently_due or []
        requirements_past_due = stripe_account.requirements.past_due or []
        charges_enabled = stripe_account.charges_enabled
        payouts_enabled = stripe_account.payouts_enabled
        details_submitted = stripe_account.details_submitted
        
        # Determine account status based on Stripe data
        if stripe_account.requirements.disabled_reason:
            account_status = PayoutAccountStatus.RESTRICTED
        elif len(requirements_currently_due) > 0:
            account_status = PayoutAccountStatus.INCOMPLETE
        elif charges_enabled and payouts_enabled:
            account_status = PayoutAccountStatus.ACTIVE
        else:
            account_status = PayoutAccountStatus.PENDING
        
        print(f"Account {account_id} status: {account_status.value}, charges_enabled: {charges_enabled}, payouts_enabled: {payouts_enabled}")
        
        # We need to find which user this account belongs to
        # For now, we'll use a simple approach - in production you'd want better indexing
        from app.libs.repository import PaymentRepository
        import asyncpg
        import databutton as db
        from app.env import mode, Mode
        
        # Get database connection
        database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
        
        conn = await asyncpg.connect(database_url)
        try:
            # Find payout account by stripe_account_id
            row = await conn.fetchrow(
                "SELECT user_id, account_id FROM payout_accounts WHERE stripe_account_id = $1",
                account_id
            )
            
            if not row:
                print(f"No payout account found for Stripe account {account_id}")
                return
            
            user_id = row['user_id']
            account_db_id = row['account_id']
            
            # Update the payout account
            await conn.execute(
                """
                UPDATE payout_accounts 
                SET 
                    account_status = $1,
                    requirements_currently_due = $2,
                    requirements_past_due = $3,
                    charges_enabled = $4,
                    payouts_enabled = $5,
                    details_submitted = $6,
                    capabilities = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE stripe_account_id = $8
                """,
                account_status.value,
                requirements_currently_due,
                requirements_past_due,
                charges_enabled,
                payouts_enabled,
                details_submitted,
                dict(stripe_account.capabilities) if stripe_account.capabilities else {},
                account_id
            )
            
            print(f"Updated payout account for user {user_id} with new status: {account_status.value}")
            
        finally:
            await conn.close()
        
    except Exception as e:
        print(f"Error processing account update: {str(e)}")
        raise

@router.post("/reconcile-payment", response_model=PaymentReconciliationResponse)
async def manual_payment_reconciliation(request: PaymentReconciliationRequest, user: str = Header(..., alias="x-user-id")):
    """Manually reconcile a payment to an invoice."""
    try:
        repo = PaymentRepository(user)
        
        # Get the invoice
        invoice = await repo.get_invoice(request.invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if invoice is already paid
        if invoice.status == InvoiceStatus.PAID:
            raise HTTPException(status_code=400, detail="Invoice is already marked as paid")
        
        # Validate payment amount
        if request.payment_amount > invoice.amount:
            raise HTTPException(status_code=400, detail="Payment amount cannot exceed invoice amount")
        
        # Map payment method string to enum
        method_mapping = {
            'card': PaymentMethod.CARD,
            'bank_transfer': PaymentMethod.BANK_TRANSFER,
            'cash': PaymentMethod.CASH,
            'check': PaymentMethod.CHECK,
            'other': PaymentMethod.OTHER
        }
        mapped_method = method_mapping.get(request.payment_method.lower(), PaymentMethod.OTHER)
        
        # Create payment record
        payment = create_payment(
            user_id=user,
            invoice_id=request.invoice_id,
            amount=request.payment_amount,
            currency=invoice.currency,
            method=mapped_method,
            transaction_id=request.transaction_id,
            notes=request.notes or "Manual reconciliation"
        )
        
        # Save payment
        created_payment = await repo.create_payment(payment)
        
        # Update invoice status to paid if full amount
        if request.payment_amount >= invoice.amount:
            invoice.status = InvoiceStatus.PAID
            await repo.update_invoice(invoice)
            status_message = "Invoice marked as paid"
        else:
            status_message = "Partial payment recorded"
        
        return PaymentReconciliationResponse(
            payment_id=created_payment.id,
            invoice_id=request.invoice_id,
            amount=request.payment_amount,
            status="success",
            message=status_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in manual payment reconciliation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reconcile payment")

@router.get("/test")
async def test_webhook():
    """Test endpoint to verify webhook API is working."""
    return {
        "status": "ok",
        "message": "Webhook API is working",
        "timestamp": datetime.now().isoformat()
    }
