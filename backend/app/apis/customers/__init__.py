from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.models import create_customer
from app.libs.audit_logging import audit_logger, AuditAction, ResourceType

router = APIRouter(prefix="/customers")

# Request/Response models
class CreateCustomerRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Customer name")
    email: str = Field(..., description="Customer email address")
    phone: Optional[str] = Field(None, max_length=50, description="Customer phone number")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes about the customer")

class UpdateCustomerRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Customer name")
    email: Optional[str] = Field(None, description="Customer email address")
    phone: Optional[str] = Field(None, max_length=50, description="Customer phone number")
    notes: Optional[str] = Field(None, max_length=1000, description="Additional notes about the customer")

class CustomerResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CustomersListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
    page: int
    limit: int
    has_next: bool

@router.post("/", response_model=CustomerResponse)
async def create_customer_endpoint(request: CreateCustomerRequest, user: AuthorizedUser):
    """Create a new customer."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get account_id for multi-tenant support
        account_id = await repo._get_user_account_id()
        
        # Create customer using factory function
        customer = create_customer(
            user_id=user.sub,
            account_id=account_id,
            name=request.name,
            email=request.email,
            phone=request.phone,
            notes=request.notes
        )
        
        # Save to database
        created_customer = await repo.create_customer(customer)
        
        # Log the creation for audit trail
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.CREATE,
            resource_type=ResourceType.CUSTOMER,
            resource_id=created_customer.id,
            resource_identifier=created_customer.email,
            request_data={
                "name": request.name,
                "email": request.email,
                "phone": request.phone,
                "notes": request.notes
            }
        )
        
        return CustomerResponse(
            id=created_customer.id,
            name=created_customer.name,
            email=created_customer.email,
            phone=created_customer.phone,
            notes=created_customer.notes,
            created_at=created_customer.created_at,
            updated_at=created_customer.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create customer")

@router.get("/", response_model=CustomersListResponse)
async def get_customers_endpoint(
    user: AuthorizedUser,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for name or email")
):
    """Get list of customers with pagination and optional search."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get customers with search support
        customers = await repo.get_customers(limit=limit + 1, offset=offset, search=search)  # +1 to check if there's a next page
        
        # Check if there's a next page
        has_next = len(customers) > limit
        if has_next:
            customers = customers[:-1]  # Remove the extra item
        
        # Convert to response format
        customer_responses = [
            CustomerResponse(
                id=customer.id,
                name=customer.name,
                email=customer.email,
                phone=customer.phone,
                notes=customer.notes,
                created_at=customer.created_at,
                updated_at=customer.updated_at
            )
            for customer in customers
        ]
        
        return CustomersListResponse(
            customers=customer_responses,
            total=len(customer_responses),  # This is page total, not global total
            page=page,
            limit=limit,
            has_next=has_next
        )
        
    except Exception as e:
        print(f"Error fetching customers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch customers")

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_endpoint(customer_id: UUID, user: AuthorizedUser):
    """Get a specific customer by ID."""
    try:
        repo = PaymentRepository(user.sub)
        customer = await repo.get_customer(customer_id)
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Log the read operation for audit trail
        account_id = await repo._get_user_account_id()
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.READ,
            resource_type=ResourceType.CUSTOMER,
            resource_id=customer.id,
            resource_identifier=customer.email
        )
        
        return CustomerResponse(
            id=customer.id,
            name=customer.name,
            email=customer.email,
            phone=customer.phone,
            notes=customer.notes,
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch customer")

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer_endpoint(customer_id: UUID, request: UpdateCustomerRequest, user: AuthorizedUser):
    """Update an existing customer."""
    try:
        repo = PaymentRepository(user.sub)
        
        # First, get the existing customer
        existing_customer = await repo.get_customer(customer_id)
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Capture before state for audit logging
        before_data = {
            "name": existing_customer.name,
            "email": existing_customer.email,
            "phone": existing_customer.phone,
            "notes": existing_customer.notes
        }
        
        # Update only provided fields
        if request.name is not None:
            existing_customer.name = request.name
        if request.email is not None:
            existing_customer.email = request.email
        if request.phone is not None:
            existing_customer.phone = request.phone
        if request.notes is not None:
            existing_customer.notes = request.notes
        
        # Save updated customer
        updated_customer = await repo.update_customer(existing_customer)
        
        if not updated_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Log the update for audit trail
        account_id = await repo._get_user_account_id()
        after_data = {
            "name": updated_customer.name,
            "email": updated_customer.email,
            "phone": updated_customer.phone,
            "notes": updated_customer.notes
        }
        
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.UPDATE,
            resource_type=ResourceType.CUSTOMER,
            resource_id=updated_customer.id,
            resource_identifier=updated_customer.email,
            before_data=before_data,
            after_data=after_data
        )
        
        return CustomerResponse(
            id=updated_customer.id,
            name=updated_customer.name,
            email=updated_customer.email,
            phone=updated_customer.phone,
            notes=updated_customer.notes,
            created_at=updated_customer.created_at,
            updated_at=updated_customer.updated_at
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error updating customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update customer")

@router.delete("/{customer_id}")
async def delete_customer_endpoint(customer_id: UUID, user: AuthorizedUser):
    """Delete a customer."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Check if customer exists first
        existing_customer = await repo.get_customer(customer_id)
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Capture data before deletion for audit logging
        deleted_data = {
            "name": existing_customer.name,
            "email": existing_customer.email,
            "phone": existing_customer.phone,
            "notes": existing_customer.notes
        }
        
        # Delete the customer
        success = await repo.delete_customer(customer_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Log the deletion for audit trail
        account_id = await repo._get_user_account_id()
        await audit_logger.log_crud_operation(
            user_id=user.sub,
            account_id=account_id,
            action=AuditAction.DELETE,
            resource_type=ResourceType.CUSTOMER,
            resource_id=customer_id,
            resource_identifier=existing_customer.email,
            before_data=deleted_data
        )
        
        return {"message": "Customer deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete customer")
