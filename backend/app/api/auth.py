from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.services.supabase_client import get_supabase, get_supabase_admin

router = APIRouter()


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """Return current user profile if Authorization Bearer token present."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    sb = get_supabase()
    if not sb:
        return None
    try:
        user = sb.auth.get_user(token)
        if not user or not user.user:
            return None
        admin = get_supabase_admin()
        if admin:
            profile = admin.table("profiles").select("*").eq("id", user.user.id).maybe_single().execute()
            return profile.data
        return {"id": user.user.id, "email": user.user.email}
    except Exception:
        return None