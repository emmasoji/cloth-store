from fastapi import APIRouter
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("")
async def list_categories():
    sb = get_supabase()
    if not sb:
        return []
    result = (
        sb.table("categories")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return result.data or []


@router.get("/{slug}")
async def get_category(slug: str):
    sb = get_supabase()
    if not sb:
        return None
    result = (
        sb.table("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", True)
        .maybe_single()
        .execute()
    )
    return result.data