from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, List
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


@router.post("/init")
async def init_checkout(body: CheckoutRequest):
    """Create pending order and return Paystack payment params."""
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")

    # Load cart items (simplified: expect frontend to also send items for validation)
    # In production always recalculate from server-side cart + product prices.
    order_number = f"NEON-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

    # Placeholder totals — real implementation must sum cart_items * product.price
    subtotal = 0
    shipping = 2500
    discount = 0
    total = subtotal + shipping - discount

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
    if not order_res.data:
        raise HTTPException(500, "Failed to create order")
    order = order_res.data[0]

    # Create payment record
    reference = f"txn_{uuid.uuid4().hex}"
    payment_data = {
        "order_id": order["id"],
        "reference": reference,
        "amount": total,
        "currency": body.currency,
        "status": "pending",
    }
    sb.table("payments").insert(payment_data).execute()

    # Initialize Paystack
    paystack_result = await initialize_transaction(
        email=body.customer.email,
        amount=int(total * 100),  # kobo
        reference=reference,
        currency=body.currency if body.currency == "NGN" else "NGN",  # Paystack primarily NGN
        metadata={"order_id": order["id"], "order_number": order_number},
    )

    return {
        "order_id": order["id"],
        "order_number": order_number,
        "reference": reference,
        "amount": total,
        "currency": body.currency,
        "paystack": paystack_result,
        "public_key": None,  # frontend uses VITE_PAYSTACK_PUBLIC_KEY
    }