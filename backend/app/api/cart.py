from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from app.services.supabase_client import get_supabase, get_supabase_admin
import uuid

router = APIRouter()


class CartItemIn(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1


class CartUpdate(BaseModel):
    quantity: int


def _data(res: Any):
    """Safe access for supabase execute() results (can be None in some client versions)."""
    if res is None:
        return None
    return getattr(res, "data", None)


@router.get("")
async def get_cart(
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id"),
    authorization: Optional[str] = Header(None),
):
    sb = get_supabase_admin() or get_supabase()
    if not sb:
        return {"id": None, "items": [], "cart_items": [], "subtotal": 0, "currency": "NGN"}

    cart = None
    if x_session_id:
        try:
            res = (
                sb.table("carts")
                .select("*, cart_items(*, products(*, product_images(*)), product_variants(*))")
                .eq("session_id", x_session_id)
                .limit(1)
                .execute()
            )
            rows = _data(res) or []
            cart = rows[0] if isinstance(rows, list) and rows else (rows if isinstance(rows, dict) else None)
        except Exception:
            cart = None

    if not cart:
        return {"id": None, "items": [], "cart_items": [], "subtotal": 0, "currency": "NGN"}

    # Normalize items key for frontend
    items = cart.get("cart_items") or cart.get("items") or []
    subtotal = 0.0
    for it in items:
        try:
            subtotal += float(it.get("unit_price") or 0) * int(it.get("quantity") or 0)
        except (TypeError, ValueError):
            pass
    cart["items"] = items
    cart["cart_items"] = items
    cart["subtotal"] = subtotal
    cart.setdefault("currency", "NGN")
    return cart


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
    cart_id = None
    try:
        cart_res = (
            sb.table("carts")
            .select("id")
            .eq("session_id", session_id)
            .limit(1)
            .execute()
        )
        rows = _data(cart_res) or []
        if isinstance(rows, list) and rows:
            cart_id = rows[0].get("id")
        elif isinstance(rows, dict):
            cart_id = rows.get("id")
    except Exception:
        cart_id = None

    if not cart_id:
        new_cart = sb.table("carts").insert({"session_id": session_id, "currency": "NGN"}).execute()
        new_rows = _data(new_cart) or []
        if isinstance(new_rows, list) and new_rows:
            cart_id = new_rows[0]["id"]
        elif isinstance(new_rows, dict):
            cart_id = new_rows.get("id")
        else:
            raise HTTPException(500, "Could not create cart")

    # Get product price
    prod = sb.table("products").select("price, stock_quantity").eq("id", item.product_id).limit(1).execute()
    prod_rows = _data(prod) or []
    prod_data = prod_rows[0] if isinstance(prod_rows, list) and prod_rows else None
    if not prod_data:
        raise HTTPException(404, "Product not found")
    unit_price = float(prod_data["price"])

    stock = prod_data.get("stock_quantity")
    if stock is not None and item.quantity > int(stock):
        raise HTTPException(400, "Insufficient stock")

    # Existing line item
    q = (
        sb.table("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart_id)
        .eq("product_id", item.product_id)
    )
    if item.variant_id:
        q = q.eq("variant_id", item.variant_id)
    else:
        q = q.is_("variant_id", "null")
    existing = q.limit(1).execute()
    existing_rows = _data(existing) or []
    existing_data = existing_rows[0] if isinstance(existing_rows, list) and existing_rows else None

    if existing_data:
        new_qty = int(existing_data["quantity"]) + item.quantity
        sb.table("cart_items").update({"quantity": new_qty, "unit_price": unit_price}).eq(
            "id", existing_data["id"]
        ).execute()
    else:
        row = {
            "cart_id": cart_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": unit_price,
        }
        if item.variant_id:
            row["variant_id"] = item.variant_id
        sb.table("cart_items").insert(row).execute()

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
