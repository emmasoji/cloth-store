from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.supabase_client import get_supabase_admin

router = APIRouter()


class SubscribeBody(BaseModel):
    email: EmailStr


@router.post("/subscribe")
async def subscribe(body: SubscribeBody):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    try:
        sb.table("newsletter_subscribers").insert({"email": body.email.lower()}).execute()
        return {"message": "Subscribed successfully"}
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"message": "Already subscribed"}
        raise HTTPException(400, str(e))