from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
import stripe
import databutton as db
import asyncpg

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.models import create_invoice, Invoice, InvoiceStatus, Currency, Customer
from app.libs.audit_logging import audit_logger, AuditAction, ResourceType
from app.apis.subscriptions import get_feature_access

router = APIRouter(prefix="/invoices")

# Initialize Stripe (will be set when API key is available)
# This gets the Stripe client with API key validation
def get_stripe_client():
    stripe_key = db.secrets.get("STRIPE_SECRET_KEY")
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    stripe.api_key = stripe_key
    return stripe

# Request/Response models
class CreateInvoiceRequest(BaseModel):
    customer_id: UUID = Field(..., description="Customer ID")
    invoice_number: Optional[str] = Field(None, max_length=50, description="Invoice number (auto-generated if not provided)")
    amount: Decimal = Field(..., gt=0, description="Invoice amount")
    currency: str = Field("EUR", description="Currency code (EUR or USD)")
    issue_date: date = Field(..., description="Invoice issue date")
    due_date: date = Field(..., description="Invoice due date")
    description: Optional[str] = Field(None, max_length=500, description="Invoice description or notes")
    terms: Optional[str] = Field(None, max_length=1000, description="Payment terms and conditions")
    notes: Optional[str] = Field(None, max_length=1000, description="Internal notes (not visible to customer)")

class UpdateInvoiceRequest(BaseModel):
    customer_id: Optional[UUID] = Field(None, description="Customer ID")
    invoice_number: Optional[str] = Field(None, max_length=50, description="Invoice number")
    amount: Optional[Decimal] = Field(None, gt=0, description="Invoice amount")
    currency: Optional[str] = Field(None, description="Currency code (EUR or USD)")
    issue_date: Optional[date] = Field(None, description="Invoice issue date")
    due_date: Optional[date] = Field(None, description="Invoice due date")
    description: Optional[str] = Field(None, max_length=500, description="Invoice description or notes")
    terms: Optional[str] = Field(None, max_length=1000, description="Payment terms and conditions")
    notes: Optional[str] = Field(None, max_length=1000, description="Internal notes (not visible to customer)")
    line_items: Optional[str] = Field(None, description="JSON string of line items")
    invoice_wide_tax_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Invoice-wide tax rate percentage")
    discount_type: Optional[str] = Field(None, description="Discount type (percentage or fixed)")
    discount_value: Optional[Decimal] = Field(None, ge=0, description="Discount value")
    status: Optional[str] = Field(None, description="Invoice status")

class InvoiceResponse(BaseModel):
    id: UUID
    customer_id: UUID
    customer_name: str
    customer_email: str
    invoice_number: Optional[str] = None
    amount: Decimal
    currency: str
    issue_date: date
    due_date: date
    description: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    line_items: Optional[str] = None  # JSON string of line items
    invoice_wide_tax_rate: Optional[Decimal] = None  # Tax rate percentage (0-100)
    discount_type: Optional[str] = None  # 'percentage' or 'fixed'
    discount_value: Optional[Decimal] = None  # Discount amount/percentage
    status: str
    stripe_payment_link_id: Optional[str] = None
    stripe_payment_link_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class InvoicesListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    limit: int
    has_next: bool

class InvoiceUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    amount: Optional[Decimal] = None
    due_date: Optional[date] = None
    status: Optional[str] = None


class SendInvoiceRequest(BaseModel):
    invoice_id: UUID = Field(..., description="Invoice ID to send")
    email_message: Optional[str] = Field(None, max_length=1000, description="Custom message to include in email")

@router.post("/invoices", response_model=Invoice)
async def create_invoice_endpoint(
    request: CreateInvoiceRequest, user: AuthorizedUser
) -> Invoice:
    """Creates a new invoice."""
    repo = PaymentRepository(user.sub)
    try:
        invoice_data = request.model_dump()
        new_invoice = await repo.create_invoice(invoice_data)
        return Invoice.model_validate(new_invoice)
    except Exception as e:
        print(f"Error creating invoice: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=InvoicesListResponse)
async def get_invoices_endpoint(
    user: AuthorizedUser,
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by invoice status (e.g., 'paid', 'due', 'overdue')"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    search: Optional[str] = Query(None, description="Search term for customer name, description, or invoice details"),
    # Date range filters
    issue_date_after: Optional[date] = Query(None, description="Filter invoices issued after this date"),
    issue_date_before: Optional[date] = Query(None, description="Filter invoices issued before this date"),
    due_date_after: Optional[date] = Query(None, description="Filter invoices due after this date"),
    due_date_before: Optional[date] = Query(None, description="Filter invoices due before this date"),
    # Sorting
    sort_by: Optional[str] = Query("created_at", description="Sort field: created_at, issue_date, due_date, amount, status, customer_name"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc")
):
    """Get a paginated and sortable list of invoices."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Parse status filter
        status_filter = None
        if status:
            try:
                status_filter = InvoiceStatus(status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        # Validate sort parameters
        valid_sort_fields = ["created_at", "issue_date", "due_date", "amount", "status", "customer_name"]
        if sort_by and sort_by not in valid_sort_fields:
            raise HTTPException(status_code=400, detail=f"Invalid sort_by field. Must be one of: {', '.join(valid_sort_fields)}")
        
        if sort_order and sort_order not in ["asc", "desc"]:
            raise HTTPException(status_code=400, detail="sort_order must be 'asc' or 'desc'")
        
        # Use optimized query with JOIN to avoid N+1 queries
        invoice_rows = await repo.get_invoices_with_customers(
            customer_id=customer_id,
            status=status_filter,
            search=search,
            issue_date_after=issue_date_after,
            issue_date_before=issue_date_before,
            due_date_after=due_date_after,
            due_date_before=due_date_before,
            sort_by=sort_by or "created_at",
            sort_order=sort_order or "desc",
            limit=limit + 1, 
            offset=offset
        )
        
        # Check if there's a next page
        has_next = len(invoice_rows) > limit
        if has_next:
            invoice_rows = invoice_rows[:-1]
        
        # Convert to response objects
        invoice_responses = []
        for row in invoice_rows:
            invoice_responses.append(InvoiceResponse(
                id=row['id'],
                customer_id=row['customer_id'],
                customer_name=row['customer_name'],
                customer_email=row['customer_email'],
                amount=row['amount'],
                currency=row['currency'],
                issue_date=row['issue_date'],
                due_date=row['due_date'],
                description=row['description'],
                status=row['status'],
                stripe_payment_link_id=row['stripe_payment_link_id'],
                stripe_payment_link_url=row['stripe_payment_link_url'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ))
        
        return InvoicesListResponse(
            invoices=invoice_responses,
            total=len(invoice_responses),
            page=page,
            limit=limit,
            has_next=has_next
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching invoices: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice_endpoint(user: AuthorizedUser, invoice_id: int) -> Invoice:
    """Gets a single invoice by its ID."""
    repo = PaymentRepository(user.sub)
    invoice = await repo.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice.model_validate(invoice)

@router.put("/{invoice_id}", response_model=Invoice)
async def update_invoice_endpoint(
    invoice_id: UUID,
    invoice_data: UpdateInvoiceRequest,
    user: AuthorizedUser
):
    """Update an existing invoice."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Verify invoice exists
        existing_invoice = await repo.get_invoice(invoice_id)
        if not existing_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Perform the update
        updated_invoice = await repo.update_invoice(invoice_id, invoice_data.model_dump(exclude_unset=True))
        
        if not updated_invoice:
            # This might occur if the update fails for some reason
            raise HTTPException(status_code=500, detail="Failed to update invoice")
            
        return Invoice.model_validate(updated_invoice)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice_endpoint(invoice_id: UUID, user: AuthorizedUser):
    """Delete an invoice."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Check if the invoice exists before attempting deletion
        existing_invoice = await repo.get_invoice(invoice_id)
        if not existing_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        success = await repo.delete_invoice(invoice_id)
        
        if not success:
            # This case might be redundant if get_invoice check is solid
            raise HTTPException(status_code=404, detail="Invoice not found for deletion")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete invoice")

@router.post("/send")
async def send_invoice_endpoint(request: SendInvoiceRequest, user: AuthorizedUser):
    """Send invoice via email to customer."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get invoice details
        invoice = await repo.get_invoice(request.invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get customer details
        customer = await repo.get_customer(invoice.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Check if invoice has payment link, create one if missing
        if not invoice.stripe_payment_link_url:
            print(f"Invoice {invoice.id} missing payment link, creating one...")
            
            # Create payment link for this invoice
            stripe_client = get_stripe_client()
            
            try:
                # Convert amount to cents for Stripe
                amount_cents = int(invoice.amount * 100)
                
                # Temporarily disable payout account routing for debugging
                # payout_account = await repo.get_payout_account()
                # print(f"Debug: Payout account found: {payout_account is not None}")
                # if payout_account:
                #     print(f"Debug: Payout enabled: {payout_account.payouts_enabled}, Status: {payout_account.account_status}")
                payout_account = None
                print("Debug: Temporarily bypassing payout account for testing")
                
                # First create a product
                product = stripe_client.Product.create(
                    name=f"Invoice from {user.sub[:8]}...",
                    description=invoice.description or f"Payment for invoice issued on {invoice.issue_date}"
                )
                
                # Then create a price for that product
                price = stripe_client.Price.create(
                    product=product.id,
                    unit_amount=amount_cents,
                    currency=invoice.currency.lower(),
                )
                
                # Create payment link with the price
                payment_link_params = {
                    "line_items": [
                        {
                            "price": price.id,
                            "quantity": 1,
                        }
                    ],
                    "metadata": {
                        "invoice_id": str(invoice.id),
                        "customer_id": str(invoice.customer_id),
                        "user_id": user.sub
                    }
                }
                
                # If user has connected payout account, route payment through platform with fees
                if payout_account and payout_account.payouts_enabled:
                    # Calculate platform fee (2.9% + €0.30 base Stripe fee + 1% platform fee)
                    stripe_fee_cents = int(amount_cents * 0.029) + 30  # Stripe's standard fee
                    platform_fee_cents = int(amount_cents * 0.01)     # 1% platform fee
                    total_fee_cents = stripe_fee_cents + platform_fee_cents
                    
                    # Add destination and application fee for connected account
                    payment_link_params.update({
                        "payment_intent_data": {
                            "application_fee_amount": total_fee_cents,
                            "transfer_data": {
                                "destination": payout_account.stripe_account_id,
                            },
                        },
                    })
                
                # Create payment link
                payment_link = stripe_client.PaymentLink.create(**payment_link_params)
                
                # Update invoice with payment link details
                invoice.stripe_payment_link_id = payment_link.id
                invoice.stripe_payment_link_url = payment_link.url
                await repo.update_invoice(invoice)
                
                print(f"Created payment link for invoice {invoice.id}: {payment_link.url}")
                
            except Exception as stripe_error:
                print(f"Failed to create payment link: {str(stripe_error)}")
                print(f"Error type: {type(stripe_error).__name__}")
                print(f"Error details: {getattr(stripe_error, 'user_message', 'No additional details')}")
                raise HTTPException(status_code=400, detail=f"Could not create payment link: {str(stripe_error)}")
        
        # Get branding settings for email customization
        branding_settings = await repo.get_branding_settings()
        company_name = branding_settings.get('company_name') if branding_settings else 'PayFlow Pro'
        primary_color = branding_settings.get('primary_color') if branding_settings else '#007cba'
        business_email = branding_settings.get('business_email') if branding_settings else None
        
        # Prepare branded email content
        subject = f"Invoice #{str(invoice.id)[:8]} from {company_name}"
        
        # Create branded HTML email template
        html_content = f"""
        <html>
        <head>
            <style>
                .invoice-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, {primary_color}, {primary_color}dd);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    padding: 30px;
                    background: #ffffff;
                    border: 1px solid #e0e0e0;
                }}
                .pay-button {{
                    display: inline-block;
                    background: {primary_color};
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-radius: 0 0 8px 8px;
                    color: #666;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <h1>Invoice from {company_name}</h1>
                </div>
                <div class="content">
                    <p>Dear {customer.name},</p>
                    
                    <p>You have received a new invoice for <strong>{invoice.currency} {invoice.amount}</strong>.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: {primary_color};">Invoice Details</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Amount:</strong> {invoice.currency} {invoice.amount}</li>
                            <li><strong>Issue Date:</strong> {invoice.issue_date}</li>
                            <li><strong>Due Date:</strong> {invoice.due_date}</li>
                            {f'<li><strong>Description:</strong> {invoice.description}</li>' if invoice.description else ''}
                        </ul>
                    </div>
                    
                    {f'<div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 20px 0;"><p style="margin: 0;">{request.email_message}</p></div>' if request.email_message else ''}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{invoice.stripe_payment_link_url}" class="pay-button">Pay Invoice Securely</a>
                    </div>
                    
                    <p>Thank you for your business!</p>
                    {f'<p>Best regards,<br>{company_name}</p>' if company_name != 'PayFlow Pro' else ''}
                </div>
                <div class="footer">
                    <p>This invoice was sent by {company_name} via PayFlow Pro</p>
                    {f'<p>Contact us: {business_email}</p>' if business_email else ''}
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create branded text email template
        text_content = f"""
        Invoice from {company_name}
        
        Dear {customer.name},
        
        You have received a new invoice for {invoice.currency} {invoice.amount}.
        
        Invoice Details:
        - Amount: {invoice.currency} {invoice.amount}
        - Issue Date: {invoice.issue_date}
        - Due Date: {invoice.due_date}
        {f'- Description: {invoice.description}' if invoice.description else ''}
        
        {request.email_message or ''}
        
        Pay your invoice securely here: {invoice.stripe_payment_link_url}
        
        Thank you for your business!
        {f'Best regards, {company_name}' if company_name != 'PayFlow Pro' else ''}
        
        ---
        This invoice was sent by {company_name} via PayFlow Pro
        {f'Contact us: {business_email}' if business_email else ''}
        """
        
        # Send email using Databutton SDK - with error handling
        try:
            print(f"Attempting to send email to: {customer.email}")
            print(f"Email subject: {subject}")
            
            # Send actual email
            db.notify.email(
                to=customer.email,
                subject=subject,
                content_html=html_content,
                content_text=text_content
            )
            print(f"Email sent successfully to {customer.email}")
            
        except Exception as email_error:
            print(f"Email sending failed: {str(email_error)}")
            # Don't fail the whole request if email fails - the payment link is still created
            print("Continuing without email - payment link is available for manual sharing")
        
        # Update invoice status to sent if it was draft
        if invoice.status == InvoiceStatus.DRAFT:
            invoice.status = InvoiceStatus.SENT
            await repo.update_invoice(invoice)
        
        return {"message": f"Invoice prepared successfully. Payment link: {invoice.stripe_payment_link_url} (Email service unavailable in development - please share link manually)"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending invoice: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error traceback: {e.__traceback__ if hasattr(e, '__traceback__') else 'No traceback'}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to send invoice: {str(e)}")


