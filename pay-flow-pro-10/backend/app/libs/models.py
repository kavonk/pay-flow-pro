from typing import Optional, List
from datetime import datetime, date, timezone
from decimal import Decimal
from enum import Enum
from dataclasses import dataclass
from uuid import UUID

# Enums for type safety
class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class DunningChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    BOTH = "both"

class SubscriptionStatus(str, Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    EXPIRED = "expired"

class BillingStatus(str, Enum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    PENDING = "pending"
    REFUNDED = "refunded"

class BillingReason(str, Enum):
    SUBSCRIPTION_CREATE = "subscription_create"
    SUBSCRIPTION_CYCLE = "subscription_cycle"
    SUBSCRIPTION_UPDATE = "subscription_update"

class Currency(str, Enum):
    EUR = "EUR"
    USD = "USD"
    GBP = "GBP"

class PaymentMethod(str, Enum):
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    OTHER = "other"

class PayoutAccountStatus(str, Enum):
    PENDING = "pending"
    INCOMPLETE = "incomplete"
    ACTIVE = "active"
    RESTRICTED = "restricted"
    REJECTED = "rejected"

class UserRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"

@dataclass
class Account:
    """Account model representing a tenant/organization in the multi-tenant system."""
    id: UUID
    name: str
    slug: str
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    def __post_init__(self):
        """Validate account data after initialization."""
        if not self.name.strip():
            raise ValueError("Account name cannot be empty")
        if not self.slug.strip():
            raise ValueError("Account slug cannot be empty")
        # Validate slug format (lowercase letters, numbers, hyphens only)
        import re
        if not re.match(r'^[a-z0-9-]+$', self.slug):
            raise ValueError("Account slug must contain only lowercase letters, numbers, and hyphens")

@dataclass
class UserAccount:
    """Junction model representing user membership in an account."""
    id: UUID
    user_id: str
    account_id: UUID
    role: UserRole = UserRole.MEMBER
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    # Related entities (loaded separately)
    account: Optional[Account] = None
    
    def __post_init__(self):
        """Validate user account data after initialization."""
        if not self.user_id.strip():
            raise ValueError("User ID cannot be empty")
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role in this account."""
        return self.role == UserRole.ADMIN
    
    @property
    def can_manage_users(self) -> bool:
        """Check if user can manage other users in this account."""
        return self.is_admin
    
    @property
    def can_manage_billing(self) -> bool:
        """Check if user can manage billing for this account."""
        return self.is_admin

@dataclass
class TeamInvitation:
    """Team invitation model for inviting users to join accounts."""
    id: UUID
    account_id: UUID
    invited_by_user_id: str
    email: str
    role: UserRole = UserRole.MEMBER
    token: str = ""
    expires_at: datetime = datetime.now(timezone.utc)
    accepted_at: Optional[datetime] = None
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    # Related entities (loaded separately)
    account: Optional[Account] = None
    invited_by: Optional[str] = None  # Will hold the inviter's name/email
    
    def __post_init__(self):
        """Validate invitation data after initialization."""
        if not self.email or '@' not in self.email:
            raise ValueError("Valid email address is required")
        if not self.invited_by_user_id.strip():
            raise ValueError("Invited by user ID cannot be empty")
        # Generate secure token if not provided
        if not self.token:
            import secrets
            self.token = secrets.token_urlsafe(32)
        # Set expiration to 7 days from now if not provided
        if self.expires_at <= datetime.now(timezone.utc):
            from datetime import timedelta
            self.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    @property
    def is_expired(self) -> bool:
        """Check if invitation has expired."""
        return datetime.now(timezone.utc) > self.expires_at
    
    @property
    def is_accepted(self) -> bool:
        """Check if invitation has been accepted."""
        return self.accepted_at is not None
    
    @property
    def is_pending(self) -> bool:
        """Check if invitation is still pending."""
        return not self.is_accepted and not self.is_expired

@dataclass
class PayoutAccount:
    """Payout account model for Stripe Connect accounts."""
    id: UUID
    user_id: str
    account_id: UUID
    stripe_account_id: str
    account_status: PayoutAccountStatus = PayoutAccountStatus.PENDING
    business_type: Optional[str] = None
    country: str = "IE"
    email: Optional[str] = None
    requirements_currently_due: List[str] = None
    requirements_past_due: List[str] = None
    charges_enabled: bool = False
    payouts_enabled: bool = False
    details_submitted: bool = False
    external_account_id: Optional[str] = None
    capabilities: Optional[dict] = None
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    def __post_init__(self):
        """Initialize default values."""
        if self.requirements_currently_due is None:
            self.requirements_currently_due = []
        if self.requirements_past_due is None:
            self.requirements_past_due = []
        if self.capabilities is None:
            self.capabilities = {}

# Database Models
@dataclass
class Customer:
    """Customer model representing a customer in the payment platform."""
    id: UUID
    user_id: str
    account_id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    def __post_init__(self):
        """Validate customer data after initialization."""
        if not self.name.strip():
            raise ValueError("Customer name cannot be empty")
        if not self.email.strip():
            raise ValueError("Customer email cannot be empty")
        if "@" not in self.email:
            raise ValueError("Invalid email format")

@dataclass
class Invoice:
    """Invoice model representing an invoice in the payment platform."""
    id: UUID
    user_id: str
    account_id: UUID
    customer_id: UUID
    amount: Decimal
    currency: Currency = Currency.EUR
    issue_date: date = date.today()
    due_date: date = date.today()
    description: Optional[str] = None
    invoice_number: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    line_items: Optional[str] = None  # JSON string of line items
    invoice_wide_tax_rate: Optional[Decimal] = None  # Tax rate percentage (0-100)
    discount_type: Optional[str] = None  # 'percentage' or 'fixed'
    discount_value: Optional[Decimal] = None  # Discount amount/percentage
    status: InvoiceStatus = InvoiceStatus.DRAFT
    stripe_payment_link_id: Optional[str] = None
    stripe_payment_link_url: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    # Related entities (loaded separately)
    customer: Optional[Customer] = None
    payments: List['Payment'] = None
    
    def __post_init__(self):
        """Validate invoice data after initialization."""
        if self.amount <= 0:
            raise ValueError("Invoice amount must be positive")
        if self.due_date < self.issue_date:
            raise ValueError("Due date cannot be before issue date")
        if self.payments is None:
            self.payments = []
    
    @property
    def is_overdue(self) -> bool:
        """Check if invoice is overdue."""
        return self.due_date < date.today() and self.status not in [InvoiceStatus.PAID, InvoiceStatus.CANCELLED]
    
    @property
    def total_paid(self) -> Decimal:
        """Calculate total amount paid for this invoice."""
        if not self.payments:
            return Decimal('0')
        return sum(payment.amount for payment in self.payments)
    
    @property
    def remaining_amount(self) -> Decimal:
        """Calculate remaining amount to be paid."""
        return self.amount - self.total_paid
    
    @property
    def is_fully_paid(self) -> bool:
        """Check if invoice is fully paid."""
        return self.total_paid >= self.amount

@dataclass
class Payment:
    """Payment model representing a payment against an invoice."""
    id: UUID
    user_id: str
    account_id: UUID
    invoice_id: UUID
    method: PaymentMethod
    amount: Decimal
    currency: str = "EUR"
    transaction_id: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime = datetime.now(timezone.utc)
    stripe_payment_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    # Related entities (loaded separately)
    invoice: Optional[Invoice] = None
    
    def __post_init__(self):
        """Validate payment data after initialization."""
        if self.amount <= 0:
            raise ValueError("Payment amount must be positive")
        if not isinstance(self.method, PaymentMethod):
            raise ValueError("Payment method must be a valid PaymentMethod enum")

@dataclass
class SubscriptionPlan:
    """Subscription plan model with pricing and feature definitions for the 4-tier system."""
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    price_monthly: Decimal = Decimal('0')
    price_yearly: Optional[Decimal] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    stripe_product_id: Optional[str] = None
    features: List[str] = None
    transaction_fee_percentage: Decimal = Decimal('0.029')
    max_invoices_per_month: Optional[int] = None
    max_customers: Optional[int] = None
    max_seats: Optional[int] = None
    has_custom_branding: bool = False
    has_priority_support: bool = False
    has_recurring_billing: bool = False
    has_mobile_payments: bool = False
    has_bulk_send: bool = False
    has_analytics: bool = False
    has_white_label: bool = False
    has_dedicated_support: bool = False
    has_premium_api: bool = False
    has_qr_codes: bool = True
    bulk_send_limit: Optional[int] = None
    is_active: bool = True
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    def __post_init__(self):
        """Initialize features list if None."""
        if self.features is None:
            self.features = []
    
    @property
    def is_trial(self) -> bool:
        """Check if this is the trial plan."""
        return self.slug == 'trial'
    
    @property
    def yearly_discount_percentage(self) -> float:
        """Calculate discount percentage for yearly billing."""
        if not self.price_yearly or self.price_monthly == 0:
            return 0
        monthly_yearly_total = self.price_monthly * 12
        if monthly_yearly_total == 0:
            return 0
        return float((monthly_yearly_total - self.price_yearly) / monthly_yearly_total * 100)

@dataclass
class UserSubscription:
    """User subscription model tracking current subscription state."""
    id: UUID
    user_id: str
    account_id: UUID
    plan_id: Optional[UUID] = None
    status: SubscriptionStatus = SubscriptionStatus.TRIAL
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None
    canceled_at: Optional[datetime] = None
    cancel_at_period_end: bool = False
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    # Related entities (loaded separately)
    plan: Optional[SubscriptionPlan] = None
    
    @property
    def is_trial(self) -> bool:
        """Check if subscription is in trial period."""
        return self.status == SubscriptionStatus.TRIAL
    
    @property
    def trial_days_remaining(self) -> int:
        """Calculate remaining trial days."""
        if not self.is_trial or not self.trial_end_date:
            return 0
        now = datetime.now(timezone.utc)
        # Make sure trial_end_date is timezone-aware
        trial_end = self.trial_end_date
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        remaining = (trial_end - now).days
        return max(0, remaining)
    
    @property
    def is_trial_expired(self) -> bool:
        """Check if trial has expired."""
        if not self.trial_end_date:
            return False
        now = datetime.now(timezone.utc)
        trial_end = self.trial_end_date
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        return now > trial_end
    
    @property
    def is_active(self) -> bool:
        """Check if subscription provides access to features."""
        return self.status in [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE]
    
    @property
    def requires_upgrade_prompt(self) -> bool:
        """Check if user should see upgrade prompts."""
        return (self.is_trial and self.trial_days_remaining <= 7) or \
               (self.plan and self.plan.slug == 'basic')

@dataclass
class BillingHistory:
    """Billing history model for tracking subscription payments."""
    id: UUID
    user_id: str
    account_id: UUID
    subscription_id: UUID
    amount: Decimal
    currency: str = "EUR"
    status: BillingStatus = BillingStatus.PENDING
    stripe_invoice_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    billing_reason: Optional[BillingReason] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime = datetime.now(timezone.utc)

@dataclass
class DunningRule:
    """Dunning rule model for automated payment reminders."""
    id: UUID
    user_id: str
    account_id: UUID
    name: str
    offset_days: int
    channel: DunningChannel
    message: str
    is_active: bool = True
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    def __post_init__(self):
        """Validate dunning rule data after initialization."""
        if not self.name.strip():
            raise ValueError("Dunning rule name cannot be empty")
        if self.offset_days < 0:
            raise ValueError("Offset days cannot be negative")
        if not self.message.strip():
            raise ValueError("Dunning rule message cannot be empty")
    
    def should_trigger(self, invoice: Invoice) -> bool:
        """Check if this dunning rule should trigger for an invoice."""
        if not self.is_active:
            return False
        
        # Calculate the trigger date
        trigger_date = invoice.due_date
        if self.offset_days > 0:
            # After due date
            from datetime import timedelta
            trigger_date = invoice.due_date + timedelta(days=self.offset_days)
        elif self.offset_days < 0:
            # Before due date
            from datetime import timedelta
            trigger_date = invoice.due_date - timedelta(days=abs(self.offset_days))
        
        # Check if today is the trigger date and invoice is not paid
        return (
            date.today() >= trigger_date and 
            invoice.status not in [InvoiceStatus.PAID, InvoiceStatus.CANCELLED]
        )

# Database access patterns and relationships
class DatabaseRelationships:
    """Helper class to define and validate database relationships."""
    
    @staticmethod
    def validate_customer_invoice_relationship(customer: Customer, invoice: Invoice) -> bool:
        """Validate that an invoice belongs to a customer."""
        return (
            customer.user_id == invoice.user_id and
            customer.account_id == invoice.account_id and 
            customer.id == invoice.customer_id
        )
    
    @staticmethod
    def validate_invoice_payment_relationship(invoice: Invoice, payment: Payment) -> bool:
        """Validate that a payment belongs to an invoice."""
        return (
            invoice.user_id == payment.user_id and
            invoice.account_id == payment.account_id and 
            invoice.id == payment.invoice_id
        )
    
    @staticmethod
    def validate_user_ownership(user_id: str, *entities) -> bool:
        """Validate that all entities belong to the same user (legacy check)."""
        return all(hasattr(entity, 'user_id') and entity.user_id == user_id for entity in entities)
    
    @staticmethod
    def validate_account_ownership(account_id: UUID, *entities) -> bool:
        """Validate that all entities belong to the same account (multi-tenant check)."""
        return all(hasattr(entity, 'account_id') and entity.account_id == account_id for entity in entities)
    
    @staticmethod
    def validate_user_account_access(user_id: str, account_id: UUID, user_accounts: List[UserAccount]) -> bool:
        """Validate that a user has access to an account."""
        return any(
            ua.user_id == user_id and ua.account_id == account_id 
            for ua in user_accounts
        )

# Factory functions for creating models with proper defaults
def create_customer(user_id: str, account_id: UUID, name: str, email: str, 
                  phone: Optional[str] = None, notes: Optional[str] = None) -> Customer:
    """Factory function to create a new customer."""
    from uuid import uuid4
    return Customer(
        id=uuid4(),
        user_id=user_id,
        account_id=account_id,
        name=name.strip(),
        email=email.strip().lower(),
        phone=phone.strip() if phone else None,
        notes=notes.strip() if notes else None
    )

def create_invoice(user_id: str, account_id: UUID, customer_id: UUID, amount: Decimal, 
                  currency: Currency = Currency.EUR, 
                  issue_date: Optional[date] = None,
                  due_date: Optional[date] = None,
                  description: Optional[str] = None,
                  invoice_number: Optional[str] = None,
                  terms: Optional[str] = None,
                  notes: Optional[str] = None) -> Invoice:
    """Factory function to create a new invoice."""
    from uuid import uuid4
    from datetime import timedelta
    
    if issue_date is None:
        issue_date = date.today()
    if due_date is None:
        due_date = issue_date + timedelta(days=30)  # Default 30 days payment term
    
    return Invoice(
        id=uuid4(),
        user_id=user_id,
        account_id=account_id,
        customer_id=customer_id,
        amount=amount,
        currency=currency,
        issue_date=issue_date,
        due_date=due_date,
        description=description,
        invoice_number=invoice_number,
        terms=terms,
        notes=notes
    )

def create_payment(user_id: str, account_id: UUID, invoice_id: UUID, amount: Decimal, 
                  currency: str, method: PaymentMethod, 
                  transaction_id: Optional[str] = None,
                  notes: Optional[str] = None,
                  stripe_payment_id: Optional[str] = None) -> Payment:
    """Factory function to create a new payment."""
    from uuid import uuid4
    return Payment(
        id=uuid4(),
        user_id=user_id,
        account_id=account_id,
        invoice_id=invoice_id,
        amount=amount,
        currency=currency,
        method=method,
        transaction_id=transaction_id,
        notes=notes,
        stripe_payment_id=stripe_payment_id
    )

def create_dunning_rule(user_id: str, account_id: UUID, name: str, offset_days: int, 
                       channel: DunningChannel, message: str) -> DunningRule:
    """Factory function to create a new dunning rule."""
    from uuid import uuid4
    return DunningRule(
        id=uuid4(),
        user_id=user_id,
        account_id=account_id,
        name=name.strip(),
        offset_days=offset_days,
        channel=channel,
        message=message.strip()
    )
