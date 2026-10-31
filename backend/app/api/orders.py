from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.services.supabase_client import get_supabase_admin

router = APIRouter()


@router.get("/{order_id}")
async def get_order(order_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = (
        sb.table("orders")
        .select("*, order_items(*), payments(*)")
        .eq("id", order_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Order not found")
    return result.data