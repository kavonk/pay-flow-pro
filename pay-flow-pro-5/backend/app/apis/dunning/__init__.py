from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
import asyncpg
import databutton as db
from typing import List, Optional
from app.libs.dunning_logic import process_dunning_for_all_tenants
from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.apis.subscriptions import get_feature_access

# --- Inline FeatureGuard for Workaround ---
class FeatureGuard:
    def __init__(self, feature_key: str):
        self.feature_key = feature_key

    async def __call__(self, user: AuthorizedUser):
        """
        A FastAPI dependency that checks if a user has access to a feature.
        Raises a 403 Forbidden error if access is denied.
        """
        try:
            access_response = await get_subscription_feature_access(feature_key=self.feature_key, user=user)
            
            if not access_response.has_access:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access to '{self.feature_key}' is not allowed on your current plan. Please upgrade to access this feature."
                )
        except HTTPException as e:
            if e.status_code == 403:
                raise e
            raise HTTPException(
                status_code=500,
                detail="A problem occurred while verifying your feature access."
            )
        except Exception:
            raise HTTPException(
                status_code=500,
                detail="A problem occurred while verifying your feature access."
            )
        
        return True
# --- End of Inline FeatureGuard ---

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

async def get_repository():
    repo = await PaymentRepository.create()
    try:
        yield repo
    finally:
        await repo.close()

@router.get("/rules", response_model=List[DunningRule])
async def get_dunning_rules(user: AuthorizedUser, repo: PaymentRepository = Depends(get_repository)):
    return await repo.get_dunning_rules(user.sub)

@router.post("/rules", response_model=DunningRule, status_code=201)
async def create_dunning_rule(rule: DunningRule, user: AuthorizedUser, repo: PaymentRepository = Depends(get_repository)):
    return await repo.create_dunning_rule(user.sub, rule)

@router.get("/rules/{rule_id}", response_model=DunningRule)
async def get_dunning_rule(rule_id: str, user: AuthorizedUser, repo: PaymentRepository = Depends(get_repository)):
    rule = await repo.get_dunning_rule(user.sub, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Dunning rule not found")
    return rule

@router.put("/rules/{rule_id}", response_model=DunningRule)
async def update_dunning_rule(rule_id: str, rule: DunningRule, user: AuthorizedUser, repo: PaymentRepository = Depends(get_repository)):
    updated_rule = await repo.update_dunning_rule(user.sub, rule_id, rule)
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Dunning rule not found")
    return updated_rule

@router.delete("/rules/{rule_id}", status_code=204)
async def delete_dunning_rule(rule_id: str, user: AuthorizedUser, repo: PaymentRepository = Depends(get_repository)):
    await repo.delete_dunning_rule(user.sub, rule_id)
