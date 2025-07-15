# Invoice-related database models and utilities
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, date

class InvoiceSequence:
    """
    Model representing an invoice sequence for a user
    """
    def __init__(self, user_id: str, prefix: str = "INV", next_number: int = 1):
        self.user_id = user_id
        self.prefix = prefix
        self.next_number = next_number
        
    def format_invoice_number(self, number: Optional[int] = None) -> str:
        """
        Format an invoice number with the current prefix
        """
        num = number or self.next_number
        return f"{self.prefix}-{num:03d}"
        
    def get_next_number(self) -> str:
        """
        Get the next invoice number without incrementing
        """
        return self.format_invoice_number()
        
    def reserve_next(self) -> str:
        """
        Reserve and return the next invoice number, incrementing the sequence
        """
        current = self.next_number
        self.next_number += 1
        return self.format_invoice_number(current)

class InvoiceMetadata(BaseModel):
    """
    Enhanced invoice metadata for creation
    """
    invoice_number: str
    issue_date: date
    due_date: date
    terms: Optional[str] = None
    notes: Optional[str] = None
    
    @staticmethod
    def calculate_due_date(issue_date: date, net_days: int = 30) -> date:
        """
        Calculate due date from issue date + net days
        """
        from datetime import timedelta
        return issue_date + timedelta(days=net_days)
        
    @classmethod
    def create_with_defaults(cls, invoice_number: str, issue_date: date, 
                           due_date: Optional[date] = None, terms: Optional[str] = None, 
                           notes: Optional[str] = None) -> 'InvoiceMetadata':
        """
        Create invoice metadata with smart defaults
        """
        if due_date is None:
            due_date = cls.calculate_due_date(issue_date)
            
        return cls(
            invoice_number=invoice_number,
            issue_date=issue_date,
            due_date=due_date,
            terms=terms,
            notes=notes
        )

# Common invoice terms templates
COMMON_INVOICE_TERMS = [
    "Payment is due within 30 days of invoice date.",
    "Payment is due within 15 days of invoice date.",
    "Payment is due upon receipt.",
    "Payment is due within 45 days of invoice date.",
    "Late payments may incur a 1.5% monthly service charge.",
    "Please remit payment to the address shown above.",
    "Thank you for your business!"
]

DEFAULT_TERMS = "Payment is due within 30 days of invoice date. Thank you for your business!"
