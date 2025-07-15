from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import asyncpg
import databutton as db
from typing import List, Optional
from app.libs.dunning_logic import process_dunning_for_all_tenants
from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository

router = APIRouter(prefix="/dunning", tags=["Dunning"])

class DunningRule(BaseModel):
    id: Optional[str] = None # Changed to str to handle UUIDs from the DB
    name: str
    offset_days: int
    channel: str
    message: str
    is_active: bool = True

    class Config:
        from_attributes = True

async def get_db_connection():
    from app.env import mode, Mode
    database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
    return await asyncpg.connect(database_url)

async def get_user_account_id(user_id: str, conn):
    """Get the account_id for a user from user_accounts table"""
    row = await conn.fetchrow(
        "SELECT account_id FROM user_accounts WHERE user_id = $1 LIMIT 1",
        user_id
    )
    if not row:
        raise HTTPException(status_code=400, detail="User account not found")
    return row['account_id']

@router.get("/rules", response_model=List[DunningRule])
async def get_dunning_rules(user: AuthorizedUser):
    conn = await get_db_connection()
    try:
        account_id = await get_user_account_id(user.sub, conn)
        rows = await conn.fetch(
            "SELECT id, name, offset_days, channel, message, is_active FROM dunning_rules WHERE user_id = $1 AND account_id = $2 ORDER BY offset_days", 
            user.sub, account_id
        )
        # Ensure 'id' is converted to string if it's a UUID
        return [DunningRule(id=str(r['id']), name=r['name'], offset_days=r['offset_days'], channel=r['channel'], message=r['message'], is_active=r['is_active']) for r in rows]
    finally:
        await conn.close()

@router.post("/rules", response_model=DunningRule, status_code=201)
async def create_dunning_rule(rule: DunningRule, user: AuthorizedUser):
    conn = await get_db_connection()
    try:
        account_id = await get_user_account_id(user.sub, conn)
        
        # Pydantic V2 uses model_dump
        rule_data = rule.model_dump(exclude_unset=True)
        # We don't insert the ID, the DB generates it
        if 'id' in rule_data:
            del rule_data['id']

        row = await conn.fetchrow(
            "INSERT INTO dunning_rules (user_id, account_id, name, offset_days, channel, message, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            user.sub, account_id, rule_data['name'], rule_data['offset_days'], rule_data['channel'], rule_data['message'], rule_data.get('is_active', True)
        )
        return DunningRule(id=str(row['id']), **rule_data)
    finally:
        await conn.close()

@router.get("/rules/{rule_id}", response_model=DunningRule)
async def get_dunning_rule(rule_id: str, user: AuthorizedUser):
    conn = await get_db_connection()
    try:
        account_id = await get_user_account_id(user.sub, conn)
        row = await conn.fetchrow(
            "SELECT id, name, offset_days, channel, message, is_active FROM dunning_rules WHERE id = $1 AND user_id = $2 AND account_id = $3", 
            rule_id, user.sub, account_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Dunning rule not found")
        return DunningRule(id=str(row['id']), name=row['name'], offset_days=row['offset_days'], channel=row['channel'], message=row['message'], is_active=row['is_active'])
    finally:
        await conn.close()

@router.put("/rules/{rule_id}", response_model=DunningRule)
async def update_dunning_rule(rule_id: str, rule: DunningRule, user: AuthorizedUser):
    print(f"Updating dunning rule {rule_id} for user {user.sub}")
    print(f"Rule data: {rule.model_dump()}")
    
    conn = await get_db_connection()
    try:
        account_id = await get_user_account_id(user.sub, conn)
        print(f"Found account_id: {account_id}")
        
        # First, verify the rule exists and belongs to the user
        existing_rule = await conn.fetchrow(
            "SELECT id FROM dunning_rules WHERE id = $1 AND user_id = $2 AND account_id = $3", 
            rule_id, user.sub, account_id
        )
        if not existing_rule:
            print(f"Rule not found for rule_id={rule_id}, user_id={user.sub}, account_id={account_id}")
            raise HTTPException(status_code=404, detail="Dunning rule not found")
        
        print(f"Rule exists, proceeding with update")

        # Extract only the fields we want to update
        rule_data = rule.model_dump(exclude={'id'})
        print(f"Update data: {rule_data}")
        
        await conn.execute(
            "UPDATE dunning_rules SET name = $1, offset_days = $2, channel = $3, message = $4, is_active = $5 WHERE id = $6 AND user_id = $7 AND account_id = $8",
            rule_data['name'], rule_data['offset_days'], rule_data['channel'], rule_data['message'], rule_data['is_active'], rule_id, user.sub, account_id
        )
        print(f"Update executed successfully")
        return DunningRule(id=rule_id, **rule_data)
    except Exception as e:
        print(f"Error in update_dunning_rule: {type(e).__name__}: {e}")
        raise
    finally:
        await conn.close()

@router.delete("/rules/{rule_id}", status_code=204)
async def delete_dunning_rule(rule_id: str, user: AuthorizedUser):
    conn = await get_db_connection()
    try:
        account_id = await get_user_account_id(user.sub, conn)
        
        # First, verify the rule exists and belongs to the user
        existing_rule = await conn.fetchrow(
            "SELECT id FROM dunning_rules WHERE id = $1 AND user_id = $2 AND account_id = $3", 
            rule_id, user.sub, account_id
        )
        if not existing_rule:
            raise HTTPException(status_code=404, detail="Dunning rule not found")

        await conn.execute("DELETE FROM dunning_rules WHERE id = $1 AND user_id = $2 AND account_id = $3", rule_id, user.sub, account_id)
    finally:
        await conn.close()
