from fastapi import APIRouter
from pydantic import BaseModel
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from app.env import Mode, mode

router = APIRouter()

class InvoiceNumberResponse(BaseModel):
    invoice_number: str
    prefix: str
    sequence_number: int

class UpdatePrefixRequest(BaseModel):
    prefix: str

class UpdatePrefixResponse(BaseModel):
    prefix: str
    message: str

@router.get("/next-invoice-number")
async def get_next_invoice_number(user: AuthorizedUser) -> InvoiceNumberResponse:
    """
    Get the next available invoice number for the user.
    Creates a sequence entry if it doesn't exist.
    """
    # Get database connection
    if mode == Mode.PROD:
        database_url = db.secrets.get("DATABASE_URL_PROD")
    else:
        database_url = db.secrets.get("DATABASE_URL_DEV")
    
    conn = await asyncpg.connect(database_url)
    
    try:
        # Try to get existing sequence for user
        sequence_row = await conn.fetchrow(
            "SELECT prefix, next_number FROM invoice_sequences WHERE user_id = $1",
            user.sub
        )
        
        if sequence_row:
            prefix = sequence_row['prefix']
            next_number = sequence_row['next_number']
        else:
            # Create new sequence for user with default values
            prefix = "INV"
            next_number = 1
            
            await conn.execute(
                "INSERT INTO invoice_sequences (user_id, prefix, next_number) VALUES ($1, $2, $3)",
                user.sub, prefix, next_number
            )
        
        # Format invoice number with leading zeros (e.g., INV-001)
        invoice_number = f"{prefix}-{next_number:03d}"
        
        return InvoiceNumberResponse(
            invoice_number=invoice_number,
            prefix=prefix,
            sequence_number=next_number
        )
        
    finally:
        await conn.close()

@router.post("/reserve-invoice-number")
async def reserve_invoice_number(user: AuthorizedUser) -> InvoiceNumberResponse:
    """
    Reserve the next invoice number by incrementing the sequence.
    This should be called when an invoice is actually created.
    """
    # Get database connection
    if mode == Mode.PROD:
        database_url = db.secrets.get("DATABASE_URL_PROD")
    else:
        database_url = db.secrets.get("DATABASE_URL_DEV")
    
    conn = await asyncpg.connect(database_url)
    
    try:
        # Use a transaction to ensure atomicity
        async with conn.transaction():
            # Get current sequence (with row lock)
            sequence_row = await conn.fetchrow(
                "SELECT prefix, next_number FROM invoice_sequences WHERE user_id = $1 FOR UPDATE",
                user.sub
            )
            
            if not sequence_row:
                # Create new sequence if it doesn't exist
                prefix = "INV"
                current_number = 1
                
                await conn.execute(
                    "INSERT INTO invoice_sequences (user_id, prefix, next_number) VALUES ($1, $2, $3)",
                    user.sub, prefix, current_number + 1
                )
            else:
                prefix = sequence_row['prefix']
                current_number = sequence_row['next_number']
                
                # Increment the sequence
                await conn.execute(
                    "UPDATE invoice_sequences SET next_number = next_number + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
                    user.sub
                )
            
            # Format the reserved invoice number
            invoice_number = f"{prefix}-{current_number:03d}"
            
            return InvoiceNumberResponse(
                invoice_number=invoice_number,
                prefix=prefix,
                sequence_number=current_number
            )
            
    finally:
        await conn.close()

@router.post("/update-prefix")
async def update_invoice_prefix(user: AuthorizedUser, request: UpdatePrefixRequest) -> UpdatePrefixResponse:
    """
    Update the invoice number prefix for the user.
    """
    # Validate prefix (alphanumeric, max 10 characters)
    prefix = request.prefix.upper().strip()
    if not prefix or len(prefix) > 10 or not prefix.replace('-', '').replace('_', '').isalnum():
        raise ValueError("Prefix must be 1-10 alphanumeric characters (including - and _)")
    
    # Get database connection
    if mode == Mode.PROD:
        database_url = db.secrets.get("DATABASE_URL_PROD")
    else:
        database_url = db.secrets.get("DATABASE_URL_DEV")
    
    conn = await asyncpg.connect(database_url)
    
    try:
        # Update or create sequence with new prefix
        result = await conn.execute(
            """
            INSERT INTO invoice_sequences (user_id, prefix, next_number) 
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id) 
            DO UPDATE SET prefix = $2, updated_at = CURRENT_TIMESTAMP
            """,
            user.sub, prefix
        )
        
        return UpdatePrefixResponse(
            prefix=prefix,
            message=f"Invoice prefix updated to '{prefix}'. Next invoice will be {prefix}-001 or continue current sequence."
        )
        
    finally:
        await conn.close()
