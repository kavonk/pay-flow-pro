from fastapi import APIRouter, Depends
import asyncio
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository

router = APIRouter()

# --- New Models for Consolidated Endpoint ---
class InvoiceSummary(BaseModel):
    paid: int
    sent: int
    overdue: int
    draft: int

class FinancialStatsResponse(BaseModel):
    total_revenue: float
    total_outstanding: float
    invoice_summary: InvoiceSummary

# --- Existing Models ---
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

class SettlementSummaryResponse(BaseModel):
    gross_receipts: float
    stripe_fees: float
    platform_fees: float
    net_payout: float

class TopCustomer(BaseModel):
    name: str
    total_revenue: float

class TopCustomersResponse(BaseModel):
    data: List[TopCustomer]

class Activity(BaseModel):
    id: str
    type: str
    description: str
    timestamp: datetime

class ActivityFeedResponse(BaseModel):
    data: List[Activity]

@router.get("/financial-stats", response_model=FinancialStatsResponse, summary="Get Core Financial Stats")
async def get_financial_stats(user: AuthorizedUser):
    """
    Returns the core financial stats for the main dashboard view.
    Combines total revenue/outstanding with invoice status counts.
    """
    repo = PaymentRepository(user.sub)
    
    # Fetch KPI and invoice status data concurrently
    kpi_data, invoice_status_data = await asyncio.gather(
        repo.get_kpi_summary_data(),
        repo.get_invoice_status_breakdown()
    )
    
    # Structure the data into the response model
    invoice_summary = {
        "paid": invoice_status_data.get("paid", 0),
        "sent": invoice_status_data.get("sent", 0),
        "overdue": invoice_status_data.get("overdue", 0),
        "draft": invoice_status_data.get("draft", 0),
    }

    return FinancialStatsResponse(
        total_revenue=kpi_data.get("total_revenue", 0.0),
        total_outstanding=kpi_data.get("outstanding_balance", 0.0),
        invoice_summary=InvoiceSummary(**invoice_summary)
    )

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

@router.get("/settlement-summary", response_model=SettlementSummaryResponse)
async def get_settlement_summary(
    user: AuthorizedUser,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    Returns settlement summary data.
    """
    repo = PaymentRepository(user.sub)
    summary_data = await repo.get_settlement_summary_data(start_date, end_date)
    return SettlementSummaryResponse(**summary_data)

@router.get("/top-customers", response_model=TopCustomersResponse)
async def get_top_customers(
    user: AuthorizedUser,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """
    Returns top 5 customers by revenue.
    """
    repo = PaymentRepository(user.sub)
    customers_data = await repo.get_top_customers_data(start_date, end_date)
    return TopCustomersResponse(data=customers_data)

@router.get("/activity-feed", response_model=ActivityFeedResponse)
async def get_activity_feed(user: AuthorizedUser):
    """
    Returns the recent activity feed.
    """
    repo = PaymentRepository(user.sub)
    activity_data = await repo.get_activity_feed_data()
    return ActivityFeedResponse(data=activity_data)
