from fastapi import APIRouter
from app.services.supabase_client import get_supabase, get_supabase_admin

router = APIRouter()


@router.get("/public")
async def public_settings():
    sb = get_supabase()
    if not sb:
        return {
            "announcement_bar": {"enabled": True, "text": "FREE SHIPPING ON ALL ORDERS ABOVE ₦50,000"},
            "brand": {"name": "NEON", "description": "Premium thrifted streetwear. Curated culture. Individual style."},
            "currency_default": "NGN",
            "supported_currencies": ["NGN", "USD", "GBP", "EUR"],
        }
    result = sb.table("website_settings").select("key, value").execute()
    settings = {row["key"]: row["value"] for row in (result.data or [])}
    return settings


@router.get("/homepage")
async def homepage_sections():
    sb = get_supabase()
    if not sb:
        return []
    result = (
        sb.table("homepage_sections")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    return result.data or []


@router.get("/pages/{slug}")
async def get_page(slug: str):
    sb = get_supabase()
    if not sb:
        return None
    result = (
        sb.table("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", True)
        .maybe_single()
        .execute()
    )
    return result.data