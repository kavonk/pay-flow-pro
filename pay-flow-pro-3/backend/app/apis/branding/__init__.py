from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel
from typing import Optional
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
import uuid
import base64

router = APIRouter()

class BrandingSettingsResponse(BaseModel):
    id: str
    account_id: str
    company_name: Optional[str] = None
    primary_color: str = "#3B82F6"
    secondary_color: str = "#EF4444"
    accent_color: str = "#10B981"
    logo_url: Optional[str] = None
    business_email: Optional[str] = None
    business_phone: Optional[str] = None
    created_at: str
    updated_at: str

class BrandingSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    business_email: Optional[str] = None
    business_phone: Optional[str] = None

class LogoUploadResponse(BaseModel):
    logo_url: str
    message: str

async def get_database_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

async def get_user_account_id(user_id: str) -> str:
    """Get the account_id for a user"""
    conn = await get_database_connection()
    try:
        result = await conn.fetchrow(
            "SELECT id FROM user_accounts WHERE user_id = $1",
            user_id
        )
        if not result:
            raise HTTPException(status_code=404, detail="User account not found")
        return str(result['id'])
    finally:
        await conn.close()

@router.get("/branding-settings")
async def get_branding_settings(user: AuthorizedUser) -> BrandingSettingsResponse:
    """Get branding settings for the current user's account"""
    account_id = await get_user_account_id(user.sub)
    
    conn = await get_database_connection()
    try:
        result = await conn.fetchrow(
            "SELECT * FROM branding_settings WHERE account_id = $1",
            account_id
        )
        
        if not result:
            # Create default branding settings
            result = await conn.fetchrow(
                """
                INSERT INTO branding_settings (account_id)
                VALUES ($1)
                RETURNING *
                """,
                account_id
            )
        
        return BrandingSettingsResponse(
            id=str(result['id']),
            account_id=str(result['account_id']),
            company_name=result['company_name'],
            primary_color=result['primary_color'],
            secondary_color=result['secondary_color'],
            accent_color=result['accent_color'],
            logo_url=result['logo_url'],
            business_email=result['business_email'],
            business_phone=result['business_phone'],
            created_at=result['created_at'].isoformat(),
            updated_at=result['updated_at'].isoformat()
        )
        
    finally:
        await conn.close()

@router.post("/branding-settings/upload-logo")
async def upload_logo(
    file: UploadFile,
    user: AuthorizedUser
) -> LogoUploadResponse:
    """Upload and set company logo"""
    account_id = await get_user_account_id(user.sub)
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read and process file
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
    
    # For now, create a data URL (in production, upload to cloud storage)
    file_id = str(uuid.uuid4())
    base64_data = base64.b64encode(content).decode('utf-8')
    logo_url = f"data:{file.content_type};base64,{base64_data}"
    
    # Update branding settings with new logo
    conn = await get_database_connection()
    try:
        result = await conn.fetchrow(
            """
            UPDATE branding_settings 
            SET logo_url = $2, logo_file_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE account_id = $1
            RETURNING *
            """,
            account_id, logo_url, file_id
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Branding settings not found")
        
        return LogoUploadResponse(
            logo_url=logo_url,
            message="Logo uploaded successfully"
        )
        
    finally:
        await conn.close()

@router.delete("/branding-settings/remove-logo")
async def remove_logo(user: AuthorizedUser) -> dict:
    """Remove company logo"""
    account_id = await get_user_account_id(user.sub)
    
    conn = await get_database_connection()
    try:
        result = await conn.fetchrow(
            """
            UPDATE branding_settings 
            SET logo_url = NULL, logo_file_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE account_id = $1
            RETURNING *
            """,
            account_id
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Branding settings not found")
        
        return {"message": "Logo removed successfully"}
        
    finally:
        await conn.close()

@router.put("/branding-settings")
async def update_branding_settings(
    settings: BrandingSettingsUpdate,
    user: AuthorizedUser
) -> BrandingSettingsResponse:
    """Update branding settings"""
    account_id = await get_user_account_id(user.sub)
    
    conn = await get_database_connection()
    try:
        # Build update query
        update_fields = []
        update_values = []
        
        if settings.company_name is not None:
            update_fields.append(f"company_name = ${len(update_values) + 2}")
            update_values.append(settings.company_name)
            
        if settings.primary_color is not None:
            update_fields.append(f"primary_color = ${len(update_values) + 2}")
            update_values.append(settings.primary_color)
            
        if settings.secondary_color is not None:
            update_fields.append(f"secondary_color = ${len(update_values) + 2}")
            update_values.append(settings.secondary_color)
            
        if settings.accent_color is not None:
            update_fields.append(f"accent_color = ${len(update_values) + 2}")
            update_values.append(settings.accent_color)
            
        if settings.business_email is not None:
            update_fields.append(f"business_email = ${len(update_values) + 2}")
            update_values.append(settings.business_email)
            
        if settings.business_phone is not None:
            update_fields.append(f"business_phone = ${len(update_values) + 2}")
            update_values.append(settings.business_phone)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_query = f"""
            UPDATE branding_settings 
            SET {', '.join(update_fields)}
            WHERE account_id = $1
            RETURNING *
        """
        
        result = await conn.fetchrow(update_query, account_id, *update_values)
        
        if not result:
            raise HTTPException(status_code=404, detail="Branding settings not found")
        
        return BrandingSettingsResponse(
            id=str(result['id']),
            account_id=str(result['account_id']),
            company_name=result['company_name'],
            primary_color=result['primary_color'],
            secondary_color=result['secondary_color'],
            accent_color=result['accent_color'],
            logo_url=result['logo_url'],
            business_email=result['business_email'],
            business_phone=result['business_phone'],
            created_at=result['created_at'].isoformat(),
            updated_at=result['updated_at'].isoformat()
        )
        
    finally:
        await conn.close()