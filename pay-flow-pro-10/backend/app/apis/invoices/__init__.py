from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4
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

class SendInvoiceRequest(BaseModel):
    invoice_id: UUID = Field(..., description="Invoice ID to send")
    email_message: Optional[str] = Field(None, max_length=1000, description="Custom message to include in email")

@router.post("/", response_model=InvoiceResponse)
async def create_invoice_endpoint(request: CreateInvoiceRequest, user: AuthorizedUser):
    """Create a new invoice with Stripe payment link."""
    try:
        print(f"Creating invoice for user {user.sub}")
        repo = PaymentRepository(user.sub)
        
        # Validate customer exists
        print(f"Validating customer {request.customer_id}")
        customer = await repo.get_customer(request.customer_id)
        if not customer:
            print(f"Customer {request.customer_id} not found")
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Validate currency
        if request.currency not in ["EUR", "USD"]:
            print(f"Invalid currency: {request.currency}")
            raise HTTPException(status_code=400, detail="Currency must be EUR or USD")
        
        # Validate dates
        if request.due_date < request.issue_date:
            print(f"Invalid dates: due_date {request.due_date} < issue_date {request.issue_date}")
            raise HTTPException(status_code=400, detail="Due date must be after issue date")
        
        # Get account_id for the invoice
        print("Getting account_id for user")
        account_id = await repo._get_user_account_id()
        print(f"Account ID: {account_id}")
        
        # Create invoice using factory function
        currency_enum = Currency.EUR if request.currency == "EUR" else Currency.USD
        
        print("Creating invoice object")
        invoice = create_invoice(
            user_id=user.sub,
            account_id=account_id,
            customer_id=request.customer_id,
            amount=request.amount,
            currency=currency_enum,
            issue_date=request.issue_date,
            due_date=request.due_date,
            description=request.description,
            invoice_number=request.invoice_number,
            terms=request.terms,
            notes=request.notes
        )
        print(f"Invoice object created with ID: {invoice.id}")
        
        # Save to database
        print("Saving invoice to database")
        created_invoice = await repo.create_invoice(invoice)
        print(f"Invoice saved successfully with ID: {created_invoice.id}")
        
        return InvoiceResponse(
            id=created_invoice.id,
            customer_id=created_invoice.customer_id,
            customer_name=customer.name,
            customer_email=customer.email,
            invoice_number=created_invoice.invoice_number,
            amount=created_invoice.amount,
            currency=created_invoice.currency,
            issue_date=created_invoice.issue_date,
            due_date=created_invoice.due_date,
            description=created_invoice.description,
            terms=created_invoice.terms,
            notes=created_invoice.notes,
            status=created_invoice.status.value,
            stripe_payment_link_id=created_invoice.stripe_payment_link_id,
            stripe_payment_link_url=created_invoice.stripe_payment_link_url,
            created_at=created_invoice.created_at,
            updated_at=created_invoice.updated_at
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (they have proper status codes)
        raise
    except Exception as e:
        print(f"Unexpected error creating invoice: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/", response_model=InvoicesListResponse)
async def get_invoices_endpoint(
    user: AuthorizedUser,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
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
    """Get list of invoices with pagination and optional filters."""
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
        
    except Exception as e:
        print(f"Error fetching invoices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoices")

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice_endpoint(invoice_id: UUID, user: AuthorizedUser):
    """Get a specific invoice by ID."""
    try:
        repo = PaymentRepository(user.sub)
        invoice = await repo.get_invoice(invoice_id)
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get customer details
        customer = await repo.get_customer(invoice.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return InvoiceResponse(
            id=invoice.id,
            customer_id=invoice.customer_id,
            customer_name=customer.name,
            customer_email=customer.email,
            amount=invoice.amount,
            currency=invoice.currency,
            issue_date=invoice.issue_date,
            due_date=invoice.due_date,
            description=invoice.description,
            status=invoice.status.value,
            stripe_payment_link_id=invoice.stripe_payment_link_id,
            stripe_payment_link_url=invoice.stripe_payment_link_url,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoice")

@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice_endpoint(invoice_id: UUID, request: UpdateInvoiceRequest, user: AuthorizedUser):
    """Update an existing invoice."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get existing invoice
        existing_invoice = await repo.get_invoice(invoice_id)
        if not existing_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Update only provided fields
        if request.customer_id is not None:
            # Validate customer exists
            customer = await repo.get_customer(request.customer_id)
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")
            existing_invoice.customer_id = request.customer_id
            
        if request.invoice_number is not None:
            existing_invoice.invoice_number = request.invoice_number
        if request.amount is not None:
            existing_invoice.amount = request.amount
        if request.currency is not None:
            if request.currency not in ["EUR", "USD"]:
                raise HTTPException(status_code=400, detail="Currency must be EUR or USD")
            # Convert string currency to enum
            existing_invoice.currency = Currency.EUR if request.currency == "EUR" else Currency.USD
        if request.issue_date is not None:
            existing_invoice.issue_date = request.issue_date
        if request.due_date is not None:
            existing_invoice.due_date = request.due_date
        if request.description is not None:
            existing_invoice.description = request.description
        if request.terms is not None:
            existing_invoice.terms = request.terms
        if request.notes is not None:
            existing_invoice.notes = request.notes
        if request.line_items is not None:
            existing_invoice.line_items = request.line_items
        if request.invoice_wide_tax_rate is not None:
            existing_invoice.invoice_wide_tax_rate = request.invoice_wide_tax_rate
        if request.discount_type is not None:
            if request.discount_type not in ["percentage", "fixed"]:
                raise HTTPException(status_code=400, detail="Discount type must be 'percentage' or 'fixed'")
            existing_invoice.discount_type = request.discount_type
        if request.discount_value is not None:
            existing_invoice.discount_value = request.discount_value
        if request.status is not None:
            try:
                existing_invoice.status = InvoiceStatus(request.status)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid status")
        
        # Validate dates
        if existing_invoice.due_date < existing_invoice.issue_date:
            raise HTTPException(status_code=400, detail="Due date must be after issue date")
        
        # Save updated invoice
        updated_invoice = await repo.update_invoice(existing_invoice)
        
        if not updated_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get customer details
        customer = await repo.get_customer(updated_invoice.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return InvoiceResponse(
            id=updated_invoice.id,
            customer_id=updated_invoice.customer_id,
            customer_name=customer.name,
            customer_email=customer.email,
            invoice_number=updated_invoice.invoice_number,
            amount=updated_invoice.amount,
            currency=updated_invoice.currency if isinstance(updated_invoice.currency, str) else updated_invoice.currency.value,
            issue_date=updated_invoice.issue_date,
            due_date=updated_invoice.due_date,
            description=updated_invoice.description,
            terms=updated_invoice.terms,
            notes=updated_invoice.notes,
            line_items=updated_invoice.line_items,
            invoice_wide_tax_rate=updated_invoice.invoice_wide_tax_rate,
            discount_type=updated_invoice.discount_type,
            discount_value=updated_invoice.discount_value,
            status=updated_invoice.status.value,
            stripe_payment_link_id=updated_invoice.stripe_payment_link_id,
            stripe_payment_link_url=updated_invoice.stripe_payment_link_url,
            created_at=updated_invoice.created_at,
            updated_at=updated_invoice.updated_at
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error updating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update invoice")

@router.delete("/{invoice_id}")
async def delete_invoice_endpoint(invoice_id: UUID, user: AuthorizedUser):
    """Delete an invoice."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Check if invoice exists
        existing_invoice = await repo.get_invoice(invoice_id)
        if not existing_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Delete the invoice
        success = await repo.delete_invoice(invoice_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"message": "Invoice deleted successfully"}
        
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
        branding_settings = await get_branding_settings_for_user(user.sub)
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
        
        # Send email using Databutton SDK
        db.notify.email(
            to=customer.email,
            subject=subject,
            content_html=html_content,
            content_text=text_content
        )
        
        # Update invoice status to sent if it was draft
        if invoice.status == InvoiceStatus.DRAFT:
            invoice.status = InvoiceStatus.SENT
            await repo.update_invoice(invoice)
        
        return {"message": f"Invoice sent successfully to {customer.email}"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send invoice")

# Helper functions for branding integration
async def get_database_connection():
    """Get database connection for invoices API."""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    if not database_url:
        raise HTTPException(status_code=500, detail="Database connection not configured")
    return await asyncpg.connect(database_url)

async def get_branding_settings_for_user(user_id: str) -> dict | None:
    """Get branding settings for a user."""
    try:
        account_id = await get_user_account_id(user_id)
        conn = await get_database_connection()
        try:
            result = await conn.fetchrow(
                "SELECT * FROM branding_settings WHERE account_id = $1",
                account_id
            )
            if result:
                return dict(result)
            return None
        finally:
            await conn.close()
    except Exception as e:
        print(f"Error getting branding settings: {str(e)}")
        return None

async def get_user_account_id(user_id: str) -> UUID:
    """Get account ID for the user."""
    conn = await get_database_connection()
    try:
        # Try to get existing account
        result = await conn.fetchrow(
            "SELECT account_id FROM user_accounts WHERE user_id = $1",
            user_id
        )
        
        if result:
            return UUID(str(result['account_id']))
        
        # If user doesn't exist in user_accounts, create a new account entry
        account_id = uuid4()
        await conn.execute(
            """
            INSERT INTO user_accounts (id, user_id, account_id, role, created_at, updated_at)
            VALUES ($1, $2, $3, 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """,
            uuid4(), user_id, account_id
        )
        
        return account_id
        
    finally:
        await conn.close()
