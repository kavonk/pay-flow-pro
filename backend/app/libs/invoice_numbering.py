# Invoice numbering utilities and database operations
import asyncpg
import databutton as db
from app.env import Mode, mode
from typing import Optional, Tuple

class InvoiceNumberingService:
    """
    Service class for managing invoice numbering sequences
    """
    
    @staticmethod
    async def get_database_connection():
        """Get database connection based on current mode"""
        if mode == Mode.PROD:
            database_url = db.secrets.get("DATABASE_URL_PROD")
        else:
            database_url = db.secrets.get("DATABASE_URL_DEV")
        return await asyncpg.connect(database_url)
    
    @staticmethod
    async def get_next_invoice_number(user_id: str) -> Tuple[str, str, int]:
        """
        Get the next available invoice number for a user.
        Returns: (formatted_invoice_number, prefix, sequence_number)
        """
        conn = await InvoiceNumberingService.get_database_connection()
        
        try:
            # Get or create sequence for user
            sequence_row = await conn.fetchrow(
                "SELECT prefix, next_number FROM invoice_sequences WHERE user_id = $1",
                user_id
            )
            
            if sequence_row:
                prefix = sequence_row['prefix']
                next_number = sequence_row['next_number']
            else:
                # Create default sequence
                prefix = "INV"
                next_number = 1
                
                await conn.execute(
                    "INSERT INTO invoice_sequences (user_id, prefix, next_number) VALUES ($1, $2, $3)",
                    user_id, prefix, next_number
                )
            
            # Format with leading zeros
            invoice_number = f"{prefix}-{next_number:03d}"
            return invoice_number, prefix, next_number
            
        finally:
            await conn.close()
    
    @staticmethod
    async def reserve_invoice_number(user_id: str) -> Tuple[str, str, int]:
        """
        Reserve the next invoice number by incrementing the sequence.
        Returns: (reserved_invoice_number, prefix, sequence_number)
        """
        conn = await InvoiceNumberingService.get_database_connection()
        
        try:
            async with conn.transaction():
                # Get current sequence with lock
                sequence_row = await conn.fetchrow(
                    "SELECT prefix, next_number FROM invoice_sequences WHERE user_id = $1 FOR UPDATE",
                    user_id
                )
                
                if not sequence_row:
                    # Create new sequence
                    prefix = "INV"
                    current_number = 1
                    
                    await conn.execute(
                        "INSERT INTO invoice_sequences (user_id, prefix, next_number) VALUES ($1, $2, $3)",
                        user_id, prefix, current_number + 1
                    )
                else:
                    prefix = sequence_row['prefix']
                    current_number = sequence_row['next_number']
                    
                    # Increment sequence
                    await conn.execute(
                        "UPDATE invoice_sequences SET next_number = next_number + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
                        user_id
                    )
                
                # Format reserved number
                invoice_number = f"{prefix}-{current_number:03d}"
                return invoice_number, prefix, current_number
                
        finally:
            await conn.close()
    
    @staticmethod
    async def update_prefix(user_id: str, new_prefix: str) -> str:
        """
        Update the invoice prefix for a user.
        Returns: The updated prefix
        """
        # Validate and clean prefix
        prefix = new_prefix.upper().strip()
        if not prefix or len(prefix) > 10:
            raise ValueError("Prefix must be 1-10 characters")
        
        conn = await InvoiceNumberingService.get_database_connection()
        
        try:
            # Update or create sequence with new prefix
            await conn.execute(
                """
                INSERT INTO invoice_sequences (user_id, prefix, next_number) 
                VALUES ($1, $2, 1)
                ON CONFLICT (user_id) 
                DO UPDATE SET prefix = $2, updated_at = CURRENT_TIMESTAMP
                """,
                user_id, prefix
            )
            
            return prefix
            
        finally:
            await conn.close()
    
    @staticmethod
    def format_invoice_number(prefix: str, number: int) -> str:
        """
        Format an invoice number with prefix and zero-padding
        """
        return f"{prefix}-{number:03d}"
    
    @staticmethod
    def validate_prefix(prefix: str) -> bool:
        """
        Validate that a prefix meets requirements
        """
        if not prefix or len(prefix) > 10:
            return False
        # Allow alphanumeric, dash, and underscore
        return prefix.replace('-', '').replace('_', '').isalnum()
