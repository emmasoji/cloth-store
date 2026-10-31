from fastapi import APIRouter, Depends, HTTPException
from app.services.supabase_client import get_supabase_admin
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/overview")
async def analytics_overview():
    """Admin revenue overview — real queries only."""
    sb = get_supabase_admin()
    if not sb:
        return {
            "total_revenue": 0,
            "today_revenue": 0,
            "monthly_revenue": 0,
            "total_orders": 0,
            "pending_orders": 0,
            "completed_orders": 0,
            "average_order_value": 0,
            "total_customers": 0,
            "message": "Configure Supabase for live data",
        }

    # Simplified aggregates — expand with proper SQL views in production
    orders = sb.table("orders").select("total_amount, status, created_at").execute()
    data = orders.data or []
    paid = [o for o in data if o["status"] in ("paid", "processing", "shipped", "delivered")]
    total_revenue = sum(float(o["total_amount"] or 0) for o in paid)
    today = datetime.utcnow().date().isoformat()
    today_revenue = sum(float(o["total_amount"] or 0) for o in paid if (o.get("created_at") or "")[:10] == today)
    month_start = datetime.utcnow().replace(day=1).date().isoformat()
    monthly_revenue = sum(float(o["total_amount"] or 0) for o in paid if (o.get("created_at") or "")[:10] >= month_start)

    profiles = sb.table("profiles").select("id", count="exact").execute()

    return {
        "total_revenue": total_revenue,
        "today_revenue": today_revenue,
        "monthly_revenue": monthly_revenue,
        "total_orders": len(data),
        "pending_orders": len([o for o in data if o["status"] in ("pending", "payment_pending")]),
        "completed_orders": len([o for o in data if o["status"] == "delivered"]),
        "average_order_value": (total_revenue / len(paid)) if paid else 0,
        "total_customers": profiles.count or 0,
    }