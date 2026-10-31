from fastapi import APIRouter
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("")
async def list_collections():
    sb = get_supabase()
    if not sb:
        return []
    result = (
        sb.table("collections")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return result.data or []