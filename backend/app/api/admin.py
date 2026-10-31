from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.services.supabase_client import get_supabase_admin
from pydantic import BaseModel

router = APIRouter()


def require_admin(authorization: Optional[str] = Header(None)):
    # In production: verify JWT and check profiles.role in ('admin','superadmin')
    # For now, presence of service role is assumed when using admin client
    return True


@router.get("/products")
async def admin_list_products(page: int = 1, limit: int = 50):
    sb = get_supabase_admin()
    if not sb:
        return {"items": [], "total": 0}
    offset = (page - 1) * limit
    result = (
        sb.table("products")
        .select("*, product_images(*), categories(name)", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"items": result.data or [], "total": result.count or 0}


@router.post("/products")
async def admin_create_product(body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("products").insert(body).execute()
    return result.data[0] if result.data else None


@router.patch("/products/{product_id}")
async def admin_update_product(product_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("products").update(body).eq("id", product_id).execute()
    return result.data[0] if result.data else None


@router.get("/orders")
async def admin_list_orders(status: Optional[str] = None, page: int = 1, limit: int = 50):
    sb = get_supabase_admin()
    if not sb:
        return {"items": [], "total": 0}
    query = sb.table("orders").select("*, order_items(*), payments(*)", count="exact")
    if status:
        query = query.eq("status", status)
    offset = (page - 1) * limit
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"items": result.data or [], "total": result.count or 0}


@router.patch("/orders/{order_id}")
async def admin_update_order(order_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    allowed = {"status", "tracking_number", "shipping_provider", "estimated_delivery", "notes"}
    update = {k: v for k, v in body.items() if k in allowed}
    result = sb.table("orders").update(update).eq("id", order_id).execute()
    return result.data[0] if result.data else None