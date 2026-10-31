from functools import lru_cache
from typing import Optional
from app.config import settings

_client = None
_admin_client = None


@lru_cache()
def get_supabase():
    """Anon client for public operations."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache()
def get_supabase_admin():
    """Service role client for privileged operations."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_role_key)