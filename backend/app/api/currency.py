from fastapi import APIRouter
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("/rates")
async def get_rates():
    sb = get_supabase()
    if not sb:
        return {
            "base": "NGN",
            "rates": {"NGN": 1, "USD": 0.00067, "GBP": 0.00052, "EUR": 0.00061},
        }
    result = sb.table("currency_rates").select("*").eq("base_currency", "NGN").execute()
    rates = {row["target_currency"]: float(row["rate"]) for row in (result.data or [])}
    return {"base": "NGN", "rates": rates or {"NGN": 1}}