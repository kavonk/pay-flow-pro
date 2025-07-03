from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository

router = APIRouter()

class KpiSummaryResponse(BaseModel):
    total_revenue: float
    outstanding_balance: float
    average_dso: float
    new_customers: int

class RevenueDataPoint(BaseModel):
    date: str
    revenue: float

class RevenueOverTimeResponse(BaseModel):
    data: List[RevenueDataPoint]

class InvoiceStatusBreakdownResponse(BaseModel):
    data: Dict[str, int]

@router.get("/kpi-summary", response_model=KpiSummaryResponse)
async def get_kpi_summary(
    user: AuthorizedUser,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    Calculates and returns key performance indicators for the dashboard.
    """
    repo = PaymentRepository(user.sub)
    
    summary_data = await repo.get_kpi_summary_data(start_date, end_date)
    
    return KpiSummaryResponse(
        total_revenue=summary_data.get("total_revenue", 0.0),
        outstanding_balance=summary_data.get("outstanding_balance", 0.0),
        average_dso=summary_data.get("average_dso", 0.0),
        new_customers=summary_data.get("new_customers", 0),
    )

@router.get("/revenue-over-time", response_model=RevenueOverTimeResponse)
async def get_revenue_over_time(
    user: AuthorizedUser,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    Returns revenue data over a specified time period.
    """
    # Placeholder data
    repo = PaymentRepository(user.sub)
    revenue_data = await repo.get_revenue_over_time(start_date, end_date)
    return RevenueOverTimeResponse(data=revenue_data)


@router.get("/invoice-status-breakdown", response_model=InvoiceStatusBreakdownResponse)
async def get_invoice_status_breakdown(
    user: AuthorizedUser,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    Returns the breakdown of invoices by status.
    """
    repo = PaymentRepository(user.sub)
    status_data = await repo.get_invoice_status_breakdown(start_date, end_date)
    return InvoiceStatusBreakdownResponse(data=status_data)