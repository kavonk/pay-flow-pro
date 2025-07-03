from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.models import Customer

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
        customer = Customer(**request.dict())
        created_customer = await repo.create_customer(customer)
        return CustomerResponse(**created_customer.dict())
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
        offset = (page - 1) * limit
        customers = await repo.get_customers(limit=limit + 1, offset=offset, search=search)
        
        has_next = len(customers) > limit
        if has_next:
            customers = customers[:-1]
        
        customer_responses = [CustomerResponse(**c.dict()) for c in customers]
        
        return CustomersListResponse(
            customers=customer_responses,
            total=len(customer_responses),
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
        return CustomerResponse(**customer.dict())
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
        updated_customer = await repo.update_customer(customer_id, request.dict(exclude_unset=True))
        if not updated_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return CustomerResponse(**updated_customer.dict())
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
        success = await repo.delete_customer(customer_id)
        if not success:
            raise HTTPException(status_code=404, detail="Customer not found")
        return {"message": "Customer deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting customer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete customer")
