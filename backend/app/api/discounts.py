from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.supabase_client import get_supabase_admin
from datetime import datetime, timezone

router = APIRouter()


class ValidateDiscount(BaseModel):
    code: str
    subtotal: float


@router.post("/validate")
async def validate_discount(body: ValidateDiscount):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = (
        sb.table("discounts")
        .select("*")
        .eq("code", body.code.upper())
        .eq("is_active", True)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Invalid discount code")
    d = result.data
    now = datetime.now(timezone.utc)
    if d.get("expires_at") and datetime.fromisoformat(d["expires_at"].replace("Z", "+00:00")) < now:
        raise HTTPException(400, "Discount expired")
    if d.get("max_uses") and d.get("used_count", 0) >= d["max_uses"]:
        raise HTTPException(400, "Discount fully redeemed")
    if body.subtotal < float(d.get("min_purchase") or 0):
        raise HTTPException(400, f"Minimum purchase of {d['min_purchase']} required")

    if d["type"] == "percentage":
        amount = body.subtotal * (float(d["value"]) / 100)
    else:
        amount = float(d["value"])

    return {"code": d["code"], "type": d["type"], "value": d["value"], "discount_amount": round(amount, 2)}