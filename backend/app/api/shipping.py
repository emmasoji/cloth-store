from fastapi import APIRouter
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("/methods")
async def list_methods():
    sb = get_supabase()
    if not sb:
        return [
            {"id": "std", "name": "Standard Delivery", "price": 2500, "estimated_days_min": 3, "estimated_days_max": 7},
            {"id": "exp", "name": "Express Delivery", "price": 5000, "estimated_days_min": 1, "estimated_days_max": 3},
        ]
    result = (
        sb.table("shipping_methods")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return result.data or []