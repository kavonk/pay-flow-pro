from fastapi import APIRouter, HTTPException
from app.auth import AuthorizedUser
import asyncpg
import databutton as db
from typing import List, Dict, Any

router = APIRouter(prefix="/debug", tags=["Debug"])

async def get_db_connection():
    from app.env import mode, Mode
    database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
    return await asyncpg.connect(database_url)

@router.get("/whoami", response_model=Dict[str, Any])
async def whoami(user: AuthorizedUser):
    """
    Returns the full details of the currently authenticated user object.
    This is crucial for debugging user ID and account linkage issues.
    """
    return {
        "message": "Authenticated user details retrieved.",
        "user_id": user.sub,
        "full_user_object": user.model_dump()
    }

