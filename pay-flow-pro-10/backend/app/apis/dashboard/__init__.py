
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncpg
import databutton as db
from typing import Dict

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

class InvoiceSummary(BaseModel):
    paid: int
    sent: int
    overdue: int
    draft: int

class FinancialStats(BaseModel):
    total_revenue: float
    total_outstanding: float
    invoice_summary: InvoiceSummary

async def get_db_connection():
    # Helper to get a database connection
    from app.env import mode, Mode
    try:
        database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
        conn = await asyncpg.connect(database_url)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Could not connect to the database.")

@router.get("/stats", response_model=FinancialStats)
async def get_financial_stats(user: AuthorizedUser):
    """
    Calculates and returns key financial statistics from the invoices table.
    - Total Revenue: Sum of all 'PAID' invoices.
    - Total Outstanding: Sum of all 'SENT' and 'OVERDUE' invoices.
    - Invoice Summary: A count of invoices by their status.
    
    SECURITY: Results are scoped to the user's account to prevent data leakage.
    """
    try:
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        conn = await get_db_connection()
        try:
            # This query aggregates all the necessary stats in one go for efficiency
            # CRITICAL: Added WHERE account_id = $1 to filter by user's account
            query = """
            SELECT
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN status IN ('sent', 'overdue') THEN amount ELSE 0 END), 0) as total_outstanding,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
            FROM invoices
            WHERE account_id = $1;
            """
            row = await conn.fetchrow(query, account_id)
            
            if not row:
                # This case is unlikely but good to handle; it means the table is empty.
                return FinancialStats(
                    total_revenue=0.0,
                    total_outstanding=0.0,
                    invoice_summary=InvoiceSummary(paid=0, sent=0, overdue=0, draft=0)
                )

            return FinancialStats(
                total_revenue=float(row['total_revenue']),
                total_outstanding=float(row['total_outstanding']),
                invoice_summary=InvoiceSummary(
                    paid=row['paid_count'],
                    sent=row['sent_count'],
                    overdue=row['overdue_count'],
                    draft=row['draft_count'],
                )
            )
        finally:
            await conn.close()
    except Exception as e:
        print(f"Error fetching financial stats for user {user.sub}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching financial statistics.")
