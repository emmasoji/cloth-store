from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.supabase_client import get_supabase, get_supabase_admin
import uuid

router = APIRouter()


class CartItemIn(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1


class CartUpdate(BaseModel):
    quantity: int


@router.get("")
async def get_cart(
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id"),
    authorization: Optional[str] = Header(None),
):
    sb = get_supabase_admin() or get_supabase()
    if not sb:
        return {"items": [], "subtotal": 0, "currency": "NGN"}

    cart = None
    if x_session_id:
        res = sb.table("carts").select("*, cart_items(*, products(*, product_images(*)), product_variants(*))").eq("session_id", x_session_id).maybe_single().execute()
        cart = res.data
    return cart or {"id": None, "items": [], "subtotal": 0, "currency": "NGN"}


@router.post("/items")
async def add_to_cart(
    item: CartItemIn,
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id"),
):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")

    session_id = x_session_id or str(uuid.uuid4())

    # Ensure cart exists
    cart_res = sb.table("carts").select("id").eq("session_id", session_id).maybe_single().execute()
    if cart_res.data:
        cart_id = cart_res.data["id"]
    else:
        new_cart = sb.table("carts").insert({"session_id": session_id, "currency": "NGN"}).execute()
        cart_id = new_cart.data[0]["id"]

    # Get product price
    prod = sb.table("products").select("price, stock_quantity").eq("id", item.product_id).single().execute()
    if not prod.data:
        raise HTTPException(404, "Product not found")
    unit_price = float(prod.data["price"])

    # Check stock
    if prod.data["stock_quantity"] is not None and item.quantity > prod.data["stock_quantity"]:
        raise HTTPException(400, "Insufficient stock")

    existing = (
        sb.table("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart_id)
        .eq("product_id", item.product_id)
        .eq("variant_id", item.variant_id)
        .maybe_single()
        .execute()
    )

    if existing.data:
        new_qty = existing.data["quantity"] + item.quantity
        sb.table("cart_items").update({"quantity": new_qty, "unit_price": unit_price}).eq("id", existing.data["id"]).execute()
    else:
        sb.table("cart_items").insert({
            "cart_id": cart_id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "unit_price": unit_price,
        }).execute()

    return {"session_id": session_id, "message": "Added to cart"}


@router.patch("/items/{item_id}")
async def update_cart_item(item_id: str, body: CartUpdate):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    if body.quantity <= 0:
        sb.table("cart_items").delete().eq("id", item_id).execute()
    else:
        sb.table("cart_items").update({"quantity": body.quantity}).eq("id", item_id).execute()
    return {"message": "Updated"}


@router.delete("/items/{item_id}")
async def remove_cart_item(item_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    sb.table("cart_items").delete().eq("id", item_id).execute()
    return {"message": "Removed"}