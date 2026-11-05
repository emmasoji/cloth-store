from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from app.services.supabase_client import get_supabase_admin
from app.services.paystack_service import initialize_transaction
import uuid
from datetime import datetime

router = APIRouter()


class CustomerInfo(BaseModel):
    full_name: str
    email: EmailStr
    phone: str


class DeliveryInfo(BaseModel):
    country: str = "Nigeria"
    state: str
    city: str
    address_line1: str
    address_line2: Optional[str] = None
    instructions: Optional[str] = None


class CheckoutRequest(BaseModel):
    customer: CustomerInfo
    delivery: DeliveryInfo
    cart_session_id: Optional[str] = None
    discount_code: Optional[str] = None
    currency: str = "NGN"
    shipping_method_id: Optional[str] = None


def _data(res: Any):
    if res is None:
        return None
    return getattr(res, "data", None)


@router.post("/init")
async def init_checkout(body: CheckoutRequest):
    """Create pending order from cart, snapshot variant details, return Paystack params."""
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")

    if not body.cart_session_id:
        raise HTTPException(400, "cart_session_id required")

    cart_res = (
        sb.table("carts")
        .select("id, session_id, cart_items(*, products(*, product_images(*)), product_variants(*))")
        .eq("session_id", body.cart_session_id)
        .limit(1)
        .execute()
    )
    carts = _data(cart_res) or []
    if not carts:
        raise HTTPException(400, "Cart is empty")
    cart = carts[0] if isinstance(carts, list) else carts
    cart_items = cart.get("cart_items") or []
    if not cart_items:
        raise HTTPException(400, "Cart is empty")

    line_rows = []
    subtotal = 0.0
    for ci in cart_items:
        product = ci.get("products") or {}
        variant = ci.get("product_variants") or {}
        qty = int(ci.get("quantity") or 1)
        unit = float(ci.get("unit_price") or product.get("price") or 0)
        line_total = unit * qty
        subtotal += line_total
        imgs = product.get("product_images") or []
        primary = next((i for i in imgs if i.get("is_primary")), imgs[0] if imgs else None)
        size = (variant.get("size") if isinstance(variant, dict) else None) or None
        colour = (variant.get("colour") if isinstance(variant, dict) else None) or None
        line_rows.append({
            "product_id": ci.get("product_id"),
            "variant_id": ci.get("variant_id"),
            "product_name": product.get("name") or "Product",
            "product_sku": product.get("sku") or (variant.get("sku") if isinstance(variant, dict) else None),
            "size": size,
            "colour": colour,
            "quantity": qty,
            "unit_price": unit,
            "total_price": line_total,
            "image_url": (primary or {}).get("url") if primary else None,
        })

    shipping = 2500
    discount = 0
    total = subtotal + shipping - discount
    order_number = f"NEON-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

    order_data = {
        "order_number": order_number,
        "guest_email": body.customer.email,
        "guest_phone": body.customer.phone,
        "guest_name": body.customer.full_name,
        "status": "payment_pending",
        "currency": body.currency,
        "subtotal": subtotal,
        "discount_amount": discount,
        "shipping_amount": shipping,
        "total_amount": total,
        "original_currency": "NGN",
        "original_total": total,
        "discount_code": body.discount_code,
        "shipping_address": body.delivery.model_dump(),
    }

    order_res = sb.table("orders").insert(order_data).execute()
    order_rows = _data(order_res) or []
    if not order_rows:
        raise HTTPException(500, "Failed to create order")
    order = order_rows[0] if isinstance(order_rows, list) else order_rows

    for row in line_rows:
        row["order_id"] = order["id"]
    sb.table("order_items").insert(line_rows).execute()

    reference = f"txn_{uuid.uuid4().hex}"
    payment_data = {
        "order_id": order["id"],
        "reference": reference,
        "amount": total,
        "currency": body.currency,
        "status": "pending",
    }
    sb.table("payments").insert(payment_data).execute()

    paystack_result = await initialize_transaction(
        email=body.customer.email,
        amount=int(total * 100),
        reference=reference,
        currency=body.currency if body.currency == "NGN" else "NGN",
        metadata={"order_id": order["id"], "order_number": order_number},
    )

    return {
        "order_id": order["id"],
        "order_number": order_number,
        "reference": reference,
        "amount": total,
        "currency": body.currency,
        "items": line_rows,
        "paystack": paystack_result,
        "public_key": None,
    }
