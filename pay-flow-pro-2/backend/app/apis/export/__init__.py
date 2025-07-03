from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
import csv
import json
import io

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.audit_logging import audit_logger, AuditAction, ResourceType

router = APIRouter(prefix="/export")

# Response models
class ExportResponse(BaseModel):
    format: str
    content: str
    filename: str
    count: int
    exported_at: str
    filters_applied: Dict[str, Any]

class ExportStatsResponse(BaseModel):
    available_formats: List[str]
    estimated_records: Dict[str, int]
    last_export_dates: Dict[str, Optional[str]]

@router.get("/stats", response_model=ExportStatsResponse)
async def get_export_stats(user: AuthorizedUser):
    """Get export statistics and available formats."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get counts for each data type
        customers = await repo.get_customers(limit=1, offset=0)
        invoices = await repo.get_invoices(limit=1, offset=0)
        
        # For now, we'll estimate payments count (in a real scenario, you'd have a get_payments method)
        estimated_records = {
            "customers": len(await repo.get_customers(limit=10000, offset=0)),  # Get actual count
            "invoices": len(await repo.get_invoices(limit=10000, offset=0)),  # Get actual count
            "payments": 0  # Placeholder - would need payment counting method
        }
        
        return ExportStatsResponse(
            available_formats=["csv", "json", "excel"],
            estimated_records=estimated_records,
            last_export_dates={
                "customers": None,  # Would track in database
                "invoices": None,
                "payments": None
            }
        )
        
    except Exception as e:
        print(f"Error getting export stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get export statistics")

@router.get("/customers", response_model=ExportResponse)
async def export_customers(
    user: AuthorizedUser,
    format: str = Query("csv", description="Export format: csv, json, or excel"),
    search: Optional[str] = Query(None, description="Filter customers by name or email"),
    created_after: Optional[datetime] = Query(None, description="Export customers created after this date"),
    created_before: Optional[datetime] = Query(None, description="Export customers created before this date")
):
    """Export customer data with filtering options."""
    try:
        if format not in ["csv", "json", "excel"]:
            raise HTTPException(status_code=400, detail="Format must be 'csv', 'json', or 'excel'")
        
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        # Get all customers (with potential filtering)
        customers = await repo.get_customers(limit=50000, offset=0, search=search)
        
        # Apply date filtering if provided
        if created_after or created_before:
            filtered_customers = []
            for customer in customers:
                if created_after and customer.created_at < created_after:
                    continue
                if created_before and customer.created_at > created_before:
                    continue
                filtered_customers.append(customer)
            customers = filtered_customers
        
        # Prepare data for export
        export_data = []
        for customer in customers:
            # Get customer's invoice summary
            customer_invoices = await repo.get_invoices_by_customer(customer.id, limit=10000)
            total_invoices = len(customer_invoices)
            total_amount = sum(invoice.amount for invoice in customer_invoices)
            paid_invoices = len([inv for inv in customer_invoices if inv.status == 'paid'])
            
            export_data.append({
                "id": str(customer.id),
                "name": customer.name,
                "email": customer.email,
                "phone": customer.phone or "",
                "notes": customer.notes or "",
                "created_at": customer.created_at.isoformat(),
                "updated_at": customer.updated_at.isoformat(),
                "total_invoices": total_invoices,
                "total_invoice_amount": float(total_amount),
                "paid_invoices": paid_invoices,
                "outstanding_invoices": total_invoices - paid_invoices
            })
        
        # Generate export content based on format
        if format == "csv":
            output = io.StringIO()
            if export_data:
                fieldnames = export_data[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(export_data)
            content = output.getvalue()
            filename = f"customers_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        elif format == "json":
            content = json.dumps(export_data, indent=2, default=str)
            filename = f"customers_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        elif format == "excel":
            # For Excel format, we'll return CSV with Excel-friendly formatting
            output = io.StringIO()
            if export_data:
                fieldnames = export_data[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(export_data)
            content = output.getvalue()
            filename = f"customers_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        # Log the export action
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.EXPORT_DATA,
            resource_type=ResourceType.CUSTOMER,
            request_data={
                "format": format,
                "search": search,
                "created_after": created_after.isoformat() if created_after else None,
                "created_before": created_before.isoformat() if created_before else None,
                "record_count": len(export_data)
            }
        )
        
        return ExportResponse(
            format=format,
            content=content,
            filename=filename,
            count=len(export_data),
            exported_at=datetime.utcnow().isoformat(),
            filters_applied={
                "search": search,
                "created_after": created_after.isoformat() if created_after else None,
                "created_before": created_before.isoformat() if created_before else None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting customers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export customers")

@router.get("/invoices", response_model=ExportResponse)
async def export_invoices(
    user: AuthorizedUser,
    format: str = Query("csv", description="Export format: csv, json, or excel"),
    status: Optional[str] = Query(None, description="Filter by invoice status"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    issue_date_after: Optional[datetime] = Query(None, description="Filter invoices issued after this date"),
    issue_date_before: Optional[datetime] = Query(None, description="Filter invoices issued before this date"),
    due_date_after: Optional[datetime] = Query(None, description="Filter invoices due after this date"),
    due_date_before: Optional[datetime] = Query(None, description="Filter invoices due before this date")
):
    """Export invoice data with comprehensive filtering options."""
    try:
        if format not in ["csv", "json", "excel"]:
            raise HTTPException(status_code=400, detail="Format must be 'csv', 'json', or 'excel'")
        
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        # Get all invoices
        all_invoices = await repo.get_invoices(limit=50000, offset=0)
        
        # Apply filters
        filtered_invoices = []
        for invoice in all_invoices:
            # Status filter
            if status and invoice.status != status:
                continue
            
            # Customer filter
            if customer_id and invoice.customer_id != customer_id:
                continue
            
            # Issue date filters
            if issue_date_after and invoice.issue_date < issue_date_after.date():
                continue
            if issue_date_before and invoice.issue_date > issue_date_before.date():
                continue
            
            # Due date filters
            if due_date_after and invoice.due_date < due_date_after.date():
                continue
            if due_date_before and invoice.due_date > due_date_before.date():
                continue
            
            filtered_invoices.append(invoice)
        
        # Prepare data for export with customer information
        export_data = []
        for invoice in filtered_invoices:
            # Get customer information
            customer = await repo.get_customer(invoice.customer_id)
            
            export_data.append({
                "invoice_id": str(invoice.id),
                "invoice_number": invoice.invoice_number,
                "customer_id": str(invoice.customer_id),
                "customer_name": customer.name if customer else "Unknown",
                "customer_email": customer.email if customer else "Unknown",
                "amount": float(invoice.amount),
                "currency": invoice.currency,
                "status": invoice.status,
                "issue_date": invoice.issue_date.isoformat(),
                "due_date": invoice.due_date.isoformat(),
                "description": invoice.description or "",
                "stripe_payment_link": invoice.stripe_payment_link or "",
                "created_at": invoice.created_at.isoformat(),
                "updated_at": invoice.updated_at.isoformat(),
                "days_overdue": max(0, (datetime.utcnow().date() - invoice.due_date).days) if invoice.status != 'paid' else 0
            })
        
        # Generate export content
        if format == "csv":
            output = io.StringIO()
            if export_data:
                fieldnames = export_data[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(export_data)
            content = output.getvalue()
            filename = f"invoices_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        elif format == "json":
            content = json.dumps(export_data, indent=2, default=str)
            filename = f"invoices_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        elif format == "excel":
            output = io.StringIO()
            if export_data:
                fieldnames = export_data[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(export_data)
            content = output.getvalue()
            filename = f"invoices_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        # Log the export action
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.EXPORT_DATA,
            resource_type=ResourceType.INVOICE,
            request_data={
                "format": format,
                "status": status,
                "customer_id": str(customer_id) if customer_id else None,
                "issue_date_after": issue_date_after.isoformat() if issue_date_after else None,
                "issue_date_before": issue_date_before.isoformat() if issue_date_before else None,
                "due_date_after": due_date_after.isoformat() if due_date_after else None,
                "due_date_before": due_date_before.isoformat() if due_date_before else None,
                "record_count": len(export_data)
            }
        )
        
        return ExportResponse(
            format=format,
            content=content,
            filename=filename,
            count=len(export_data),
            exported_at=datetime.utcnow().isoformat(),
            filters_applied={
                "status": status,
                "customer_id": str(customer_id) if customer_id else None,
                "issue_date_after": issue_date_after.isoformat() if issue_date_after else None,
                "issue_date_before": issue_date_before.isoformat() if issue_date_before else None,
                "due_date_after": due_date_after.isoformat() if due_date_after else None,
                "due_date_before": due_date_before.isoformat() if due_date_before else None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting invoices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export invoices")

@router.get("/payments", response_model=ExportResponse)
async def export_payments(
    user: AuthorizedUser,
    format: str = Query("csv", description="Export format: csv, json, or excel"),
    status: Optional[str] = Query(None, description="Filter by payment status"),
    method: Optional[str] = Query(None, description="Filter by payment method"),
    date_after: Optional[datetime] = Query(None, description="Filter payments after this date"),
    date_before: Optional[datetime] = Query(None, description="Filter payments before this date")
):
    """Export payment data with filtering options."""
    try:
        if format not in ["csv", "json", "excel"]:
            raise HTTPException(status_code=400, detail="Format must be 'csv', 'json', or 'excel'")
        
        repo = PaymentRepository(user.sub)
        account_id = await repo._get_user_account_id()
        
        # For this implementation, we'll create a basic payment export
        # In a real scenario, you'd have a get_payments method in the repository
        
        # Get all invoices to derive payment information
        all_invoices = await repo.get_invoices(limit=50000, offset=0)
        
        # Create payment records from paid invoices
        export_data = []
        for invoice in all_invoices:
            if invoice.status == 'paid':
                # Get customer information
                customer = await repo.get_customer(invoice.customer_id)
                
                export_data.append({
                    "payment_id": f"pay_{invoice.id}",  # Synthetic payment ID
                    "invoice_id": str(invoice.id),
                    "invoice_number": invoice.invoice_number,
                    "customer_id": str(invoice.customer_id),
                    "customer_name": customer.name if customer else "Unknown",
                    "customer_email": customer.email if customer else "Unknown",
                    "amount": float(invoice.amount),
                    "currency": invoice.currency,
                    "method": "stripe",  # Default to stripe
                    "status": "completed",  # Paid invoices are completed payments
                    "processed_at": invoice.updated_at.isoformat(),  # Use invoice update time as payment time
                    "description": f"Payment for {invoice.description or 'Invoice'}" 
                })
        
        # Apply filters
        filtered_payments = []
        for payment in export_data:
            # Status filter
            if status and payment["status"] != status:
                continue
            
            # Method filter
            if method and payment["method"] != method:
                continue
            
            # Date filters
            payment_date = datetime.fromisoformat(payment["processed_at"])
            if date_after and payment_date < date_after:
                continue
            if date_before and payment_date > date_before:
                continue
            
            filtered_payments.append(payment)
        
        # Generate export content
        if format == "csv":
            output = io.StringIO()
            if filtered_payments:
                fieldnames = filtered_payments[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(filtered_payments)
            content = output.getvalue()
            filename = f"payments_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        elif format == "json":
            content = json.dumps(filtered_payments, indent=2, default=str)
            filename = f"payments_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        elif format == "excel":
            output = io.StringIO()
            if filtered_payments:
                fieldnames = filtered_payments[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(filtered_payments)
            content = output.getvalue()
            filename = f"payments_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        # Log the export action
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.EXPORT_DATA,
            resource_type=ResourceType.PAYMENT,
            request_data={
                "format": format,
                "status": status,
                "method": method,
                "date_after": date_after.isoformat() if date_after else None,
                "date_before": date_before.isoformat() if date_before else None,
                "record_count": len(filtered_payments)
            }
        )
        
        return ExportResponse(
            format=format,
            content=content,
            filename=filename,
            count=len(filtered_payments),
            exported_at=datetime.utcnow().isoformat(),
            filters_applied={
                "status": status,
                "method": method,
                "date_after": date_after.isoformat() if date_after else None,
                "date_before": date_before.isoformat() if date_before else None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error exporting payments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export payments")
