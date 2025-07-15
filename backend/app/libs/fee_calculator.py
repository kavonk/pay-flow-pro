from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Tuple
from datetime import date

# Stripe's standard transaction fees (as of 2024)
STRIPE_PERCENTAGE_FEE = Decimal('0.029')  # 2.9%
STRIPE_FIXED_FEE = Decimal('0.30')        # €0.30

# Our markup percentages by plan
PLAN_MARKUPS = {
    'free': Decimal('0.010'),      # 1.0% (higher for free users)
    'starter': Decimal('0.008'),   # 0.8%
    'pro': Decimal('0.005'),       # 0.5%
    'business': Decimal('0.003'),  # 0.3%
    'enterprise': Decimal('0.001') # 0.1%
}

def calculate_transaction_fees(payment_amount: float, plan_slug: str) -> Dict[str, Decimal]:
    """
    Calculate transaction fees for a payment.
    
    Args:
        payment_amount: The payment amount in EUR
        plan_slug: The user's subscription plan slug
        
    Returns:
        Dictionary with fee breakdown:
        - stripe_fee: Stripe's fee (2.9% + €0.30)
        - our_markup_percentage: Our markup percentage
        - our_markup_amount: Our markup amount in EUR
        - total_fee: Total fee amount
        - effective_rate: Effective rate as percentage
    """
    amount = Decimal(str(payment_amount))
    
    # Calculate Stripe's fee
    stripe_percentage_amount = amount * STRIPE_PERCENTAGE_FEE
    stripe_total_fee = stripe_percentage_amount + STRIPE_FIXED_FEE
    
    # Get our markup percentage
    markup_percentage = PLAN_MARKUPS.get(plan_slug, PLAN_MARKUPS['free'])
    
    # Calculate our markup amount
    our_markup_amount = amount * markup_percentage
    
    # Total fee
    total_fee = stripe_total_fee + our_markup_amount
    
    # Calculate effective rate
    effective_rate = (total_fee / amount) * 100 if amount > 0 else Decimal('0')
    
    # Round all amounts to 2 decimal places
    return {
        'stripe_fee': stripe_total_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'our_markup_percentage': markup_percentage,
        'our_markup_amount': our_markup_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'total_fee': total_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'effective_rate': effective_rate.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    }

def calculate_fee_preview(payment_amount: float, plan_slug: str) -> Dict[str, str]:
    """
    Calculate fee preview for displaying to users.
    Returns string values formatted for display.
    """
    fees = calculate_transaction_fees(payment_amount, plan_slug)
    
    return {
        'stripe_fee': f"€{fees['stripe_fee']}",
        'our_markup_amount': f"€{fees['our_markup_amount']}",
        'total_fee': f"€{fees['total_fee']}",
        'effective_rate': f"{fees['effective_rate']}%",
        'markup_percentage': f"{fees['our_markup_percentage'] * 100}%"
    }

def get_plan_fee_info(plan_slug: str) -> Dict[str, str]:
    """
    Get fee information for a specific plan for display on pricing page.
    """
    markup_percentage = PLAN_MARKUPS.get(plan_slug, PLAN_MARKUPS['free'])
    total_percentage = STRIPE_PERCENTAGE_FEE + markup_percentage
    
    return {
        'stripe_base': f"{STRIPE_PERCENTAGE_FEE * 100}% + €{STRIPE_FIXED_FEE}",
        'our_markup': f"{markup_percentage * 100}%",
        'total_rate': f"{total_percentage * 100}% + €{STRIPE_FIXED_FEE}",
        'example_100': calculate_fee_preview(100.0, plan_slug)['total_fee']
    }

def calculate_monthly_fee_summary(transactions: list) -> Dict[str, Decimal]:
    """
    Calculate monthly fee summary from a list of transaction records.
    
    Args:
        transactions: List of transaction dictionaries with keys:
                     payment_amount, stripe_fee_amount, our_markup_amount
                     
    Returns:
        Dictionary with monthly summary
    """
    if not transactions:
        return {
            'total_payment_volume': Decimal('0'),
            'total_stripe_fees': Decimal('0'),
            'total_our_markup': Decimal('0'),
            'total_fees': Decimal('0'),
            'transaction_count': 0,
            'average_fee_rate': Decimal('0')
        }
    
    total_payment_volume = sum(Decimal(str(t['payment_amount'])) for t in transactions)
    total_stripe_fees = sum(Decimal(str(t['stripe_fee_amount'])) for t in transactions)
    total_our_markup = sum(Decimal(str(t['our_markup_amount'])) for t in transactions)
    total_fees = total_stripe_fees + total_our_markup
    
    average_fee_rate = (total_fees / total_payment_volume * 100) if total_payment_volume > 0 else Decimal('0')
    
    return {
        'total_payment_volume': total_payment_volume.quantize(Decimal('0.01')),
        'total_stripe_fees': total_stripe_fees.quantize(Decimal('0.01')),
        'total_our_markup': total_our_markup.quantize(Decimal('0.01')),
        'total_fees': total_fees.quantize(Decimal('0.01')),
        'transaction_count': len(transactions),
        'average_fee_rate': average_fee_rate.quantize(Decimal('0.01'))
    }