from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.services.supabase_client import get_supabase, get_supabase_admin

router = APIRouter()


@router.get("")
async def list_products(
    category: Optional[str] = None,
    collection: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    colour: Optional[str] = None,
    featured: Optional[bool] = None,
    trending: Optional[bool] = None,
    sort: str = "newest",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    sb = get_supabase()
    if not sb:
        return {"items": [], "total": 0, "page": page, "limit": limit, "message": "Supabase not configured"}

    query = sb.table("products").select("*, product_images(*), product_variants(*), categories(name,slug)", count="exact")
    query = query.eq("status", "published").eq("is_active", True)

    if category:
        query = query.eq("categories.slug", category)
    if collection:
        query = query.eq("collection_id", collection)
    if search:
        query = query.ilike("name", f"%{search}%")
    if min_price is not None:
        query = query.gte("price", min_price)
    if max_price is not None:
        query = query.lte("price", max_price)
    if featured is not None:
        query = query.eq("is_featured", featured)
    if trending is not None:
        query = query.eq("is_trending", trending)

    if sort == "price_asc":
        query = query.order("price", desc=False)
    elif sort == "price_desc":
        query = query.order("price", desc=True)
    elif sort == "featured":
        query = query.order("is_featured", desc=True)
    else:
        query = query.order("created_at", desc=True)

    offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    result = query.execute()
    return {
        "items": result.data or [],
        "total": result.count or 0,
        "page": page,
        "limit": limit,
    }


@router.get("/{slug}")
async def get_product(slug: str):
    sb = get_supabase()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = (
        sb.table("products")
        .select("*, product_images(*), product_variants(*), categories(name,slug), collections(name,slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Product not found")
    return result.data


@router.get("/id/{product_id}")
async def get_product_by_id(product_id: str):
    sb = get_supabase()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = (
        sb.table("products")
        .select("*, product_images(*), product_variants(*)")
        .eq("id", product_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Product not found")
    return result.data