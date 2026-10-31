from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.supabase_client import get_supabase_admin

router = APIRouter()


class TrackRequest(BaseModel):
    order_number: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


@router.post("")
async def track_order(body: TrackRequest):
    if not body.email and not body.phone:
        raise HTTPException(400, "Email or phone required for verification")

    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")

    query = sb.table("orders").select("*, order_items(*), payments(status, paid_at, channel)").eq("order_number", body.order_number)
    result = query.maybe_single().execute()

    if not result.data:
        raise HTTPException(404, "Order not found")

    order = result.data
    # Verify identity
    match = False
    if body.email and order.get("guest_email") and body.email.lower() == order["guest_email"].lower():
        match = True
    if body.phone and order.get("guest_phone") and body.phone in (order["guest_phone"] or ""):
        match = True
    if not match:
        raise HTTPException(403, "Verification failed. Check email/phone used at checkout.")

    # Build timeline
    status = order["status"]
    steps = [
        {"key": "placed", "label": "Order Placed", "done": True},
        {"key": "payment", "label": "Payment Confirmed", "done": status in ("paid", "processing", "shipped", "out_for_delivery", "delivered")},
        {"key": "processing", "label": "Processing", "done": status in ("processing", "shipped", "out_for_delivery", "delivered")},
        {"key": "shipped", "label": "Shipped", "done": status in ("shipped", "out_for_delivery", "delivered")},
        {"key": "out", "label": "Out for Delivery", "done": status in ("out_for_delivery", "delivered")},
        {"key": "delivered", "label": "Delivered", "done": status == "delivered"},
    ]

    return {
        "order_number": order["order_number"],
        "status": status,
        "customer_name": order.get("guest_name"),
        "created_at": order.get("created_at"),
        "items": order.get("order_items", []),
        "shipping_address": order.get("shipping_address"),
        "tracking_number": order.get("tracking_number"),
        "shipping_provider": order.get("shipping_provider"),
        "estimated_delivery": order.get("estimated_delivery"),
        "timeline": steps,
        "payment": (order.get("payments") or [None])[0] if order.get("payments") else None,
    }