# Date utility functions for invoice management
from datetime import datetime, date, timedelta
from typing import Union

def calculate_due_date(issue_date: Union[str, date], net_days: int = 30) -> date:
    """
    Calculate due date from issue date + net days (default 30)
    
    Args:
        issue_date: Either a date object or ISO date string
        net_days: Number of days to add (default 30 for Net 30)
    
    Returns:
        date: The calculated due date
    """
    if isinstance(issue_date, str):
        issue_date = datetime.strptime(issue_date, '%Y-%m-%d').date()
    
    return issue_date + timedelta(days=net_days)

def parse_date_string(date_str: str) -> date:
    """
    Parse ISO date string to date object
    """
    return datetime.strptime(date_str, '%Y-%m-%d').date()

def format_date_for_display(date_obj: date) -> str:
    """
    Format date for user-friendly display
    """
    return date_obj.strftime('%B %d, %Y')

def is_due_date_valid(issue_date: Union[str, date], due_date: Union[str, date]) -> bool:
    """
    Check if due date is on or after issue date
    """
    if isinstance(issue_date, str):
        issue_date = parse_date_string(issue_date)
    if isinstance(due_date, str):
        due_date = parse_date_string(due_date)
        
    return due_date >= issue_date

def get_net_days_options():
    """
    Get common Net payment terms options
    """
    return [
        {"value": 0, "label": "Due on Receipt"},
        {"value": 7, "label": "Net 7 Days"},
        {"value": 15, "label": "Net 15 Days"},
        {"value": 30, "label": "Net 30 Days"},
        {"value": 45, "label": "Net 45 Days"},
        {"value": 60, "label": "Net 60 Days"},
        {"value": 90, "label": "Net 90 Days"},
    ]
