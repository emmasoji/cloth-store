from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.services.supabase_client import get_supabase_admin

router = APIRouter()


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


@router.delete("/products/{product_id}")
async def admin_delete_product(product_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    sb.table("product_images").delete().eq("product_id", product_id).execute()
    sb.table("product_variants").delete().eq("product_id", product_id).execute()
    sb.table("products").delete().eq("id", product_id).execute()
    return {"message": "Deleted"}


@router.post("/products/{product_id}/images")
async def admin_add_product_image(product_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    url = body.get("url")
    if not url:
        raise HTTPException(400, "url required")
    if body.get("is_primary"):
        sb.table("product_images").update({"is_primary": False}).eq("product_id", product_id).execute()
    row = {
        "product_id": product_id,
        "url": url,
        "alt_text": body.get("alt_text") or "",
        "is_primary": bool(body.get("is_primary", True)),
        "sort_order": int(body.get("sort_order") or 0),
    }
    result = sb.table("product_images").insert(row).execute()
    return result.data[0] if result.data else None


@router.delete("/product-images/{image_id}")
async def admin_delete_product_image(image_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    sb.table("product_images").delete().eq("id", image_id).execute()
    return {"message": "Deleted"}


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


@router.get("/categories")
async def admin_list_categories():
    sb = get_supabase_admin()
    if not sb:
        return []
    result = sb.table("categories").select("*").order("sort_order").execute()
    return result.data or []


@router.post("/categories")
async def admin_create_category(body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("categories").insert(body).execute()
    return result.data[0] if result.data else None


@router.patch("/categories/{category_id}")
async def admin_update_category(category_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("categories").update(body).eq("id", category_id).execute()
    return result.data[0] if result.data else None


@router.delete("/categories/{category_id}")
async def admin_delete_category(category_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    sb.table("categories").delete().eq("id", category_id).execute()
    return {"message": "Deleted"}


@router.patch("/settings/{key}")
async def admin_update_setting(key: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    existing = sb.table("website_settings").select("id").eq("key", key).maybe_single().execute()
    if existing.data:
        sb.table("website_settings").update({"value": body}).eq("key", key).execute()
    else:
        sb.table("website_settings").insert({"key": key, "value": body}).execute()
    return {"key": key, "value": body}