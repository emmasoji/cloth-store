from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.services.supabase_client import get_supabase_admin
from pydantic import BaseModel

router = APIRouter()


def require_admin(authorization: Optional[str] = Header(None)):
    # In production: verify JWT and check profiles.role in ('admin','superadmin')
    # For now, presence of service role is assumed when using admin client
    return True


@router.get("/products")
async def admin_list_products(page: int = 1, limit: int = 50):
    sb = get_supabase_admin()
    if not sb:
        return {"items": [], "total": 0}
    offset = (page - 1) * limit
    result = (
        sb.table("products")
        .select("*, product_images(*), product_variants(*), categories(name)", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"items": result.data or [], "total": result.count or 0}


@router.get("/products/{product_id}")
async def admin_get_product(product_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = (
        sb.table("products")
        .select("*, product_images(*), product_variants(*), categories(name)")
        .eq("id", product_id)
        .limit(1)
        .execute()
    )
    rows = getattr(result, "data", None) or []
    if not rows:
        raise HTTPException(404, "Product not found")
    return rows[0]


@router.post("/products")
async def admin_create_product(body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("products").insert(body).execute()
    return result.data[0] if result.data else None


@router.patch("/products/{product_id}")
async def admin_update_product(product_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("products").update(body).eq("id", product_id).execute()
    return result.data[0] if result.data else None


@router.get("/orders")
async def admin_list_orders(status: Optional[str] = None, page: int = 1, limit: int = 50):
    sb = get_supabase_admin()
    if not sb:
        return {"items": [], "total": 0}
    query = sb.table("orders").select("*, order_items(*), payments(*)", count="exact")
    if status:
        query = query.eq("status", status)
    offset = (page - 1) * limit
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"items": result.data or [], "total": result.count or 0}


@router.patch("/orders/{order_id}")
async def admin_update_order(order_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    allowed = {"status", "tracking_number", "shipping_provider", "estimated_delivery", "notes"}
    update = {k: v for k, v in body.items() if k in allowed}
    result = sb.table("orders").update(update).eq("id", order_id).execute()
    return result.data[0] if result.data else None

@router.delete("/products/{product_id}")
async def admin_delete_product(product_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")

    # 1) Collect image URLs / paths before DB delete
    try:
        imgs = sb.table("product_images").select("id, url").eq("product_id", product_id).execute()
        rows = getattr(imgs, "data", None) or []
    except Exception:
        rows = []

    # 2) Delete files from Storage (folder products/{product_id}/ and any known paths)
    try:
        bucket = sb.storage.from_("products")
        # list folder for this product id
        safe_id = product_id
        try:
            listed = bucket.list(safe_id)
            names = []
            if isinstance(listed, list):
                for item in listed:
                    name = item.get("name") if isinstance(item, dict) else getattr(item, "name", None)
                    if name:
                        names.append(f"{safe_id}/{name}")
            if names:
                bucket.remove(names)
        except Exception:
            pass
        # also try remove by parsing public URLs
        for row in rows:
            url = (row or {}).get("url") or ""
            # typical: .../storage/v1/object/public/products/{path}
            marker = "/object/public/products/"
            if marker in url:
                storage_path = url.split(marker, 1)[-1].split("?")[0]
                try:
                    bucket.remove([storage_path])
                except Exception:
                    pass
    except Exception:
        pass  # storage cleanup best-effort

    # 3) DB rows
    sb.table("product_images").delete().eq("product_id", product_id).execute()
    sb.table("product_variants").delete().eq("product_id", product_id).execute()
    sb.table("products").delete().eq("id", product_id).execute()
    return {"message": "Deleted"}


@router.patch("/settings/{key}")
async def admin_update_setting(key: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    existing = sb.table("website_settings").select("id").eq("key", key).maybe_single().execute()
    if existing.data:
        sb.table("website_settings").update({"value": body}).eq("key", key).execute()
    else:
        sb.table("website_settings").insert({"key": key, "value": body}).execute()
    return {"key": key, "value": body}


@router.get("/categories")
async def admin_list_categories():
    sb = get_supabase_admin()
    if not sb:
        return []
    result = sb.table("categories").select("*").order("sort_order").execute()
    return result.data or []


@router.post("/categories")
async def admin_create_category(body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("categories").insert(body).execute()
    return result.data[0] if result.data else None


@router.patch("/categories/{category_id}")
async def admin_update_category(category_id: str, body: dict):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    result = sb.table("categories").update(body).eq("id", category_id).execute()
    return result.data[0] if result.data else None


@router.delete("/categories/{category_id}")
async def admin_delete_category(category_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    sb.table("categories").delete().eq("id", category_id).execute()
    return {"message": "Deleted"}


@router.post("/products/{product_id}/images")
async def admin_add_product_image(product_id: str, body: dict):
    """Attach an image URL to a product. body: { url, alt_text?, is_primary? }"""
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    url = body.get("url")
    if not url:
        raise HTTPException(400, "url required")
    if body.get("is_primary"):
        sb.table("product_images").update({"is_primary": False}).eq("product_id", product_id).execute()
    row = {
        "product_id": product_id,
        "url": url,
        "alt_text": body.get("alt_text") or "",
        "is_primary": bool(body.get("is_primary", True)),
        "sort_order": int(body.get("sort_order") or 0),
    }
    result = sb.table("product_images").insert(row).execute()
    return result.data[0] if result.data else None


@router.delete("/product-images/{image_id}")
async def admin_delete_product_image(image_id: str):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    try:
        row = sb.table("product_images").select("id, url").eq("id", image_id).limit(1).execute()
        data = getattr(row, "data", None) or []
        if not data:
            # still try delete by id in case select failed
            sb.table("product_images").delete().eq("id", image_id).execute()
            return {"message": "Deleted"}
        url = (data[0].get("url") or "")
        # Extract storage path from public URL
        # e.g. .../storage/v1/object/public/products/{uuid}/file.avif
        storage_path = None
        for marker in ("/object/public/products/", "/object/sign/products/"):
            if marker in url:
                storage_path = url.split(marker, 1)[-1].split("?")[0]
                break
        if storage_path:
            try:
                sb.storage.from_("products").remove([storage_path])
            except Exception:
                pass
    except Exception:
        pass
    sb.table("product_images").delete().eq("id", image_id).execute()
    return {"message": "Deleted"}


@router.put("/products/{product_id}/variants")
async def admin_sync_variants(product_id: str, body: dict):
    """Replace all variants for a product. body: { items: [{ size, colour, weight, stock_quantity, colour_hex, sku }] }"""
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")
    items = body.get("items") or body.get("variants") or []
    # remove existing
    sb.table("product_variants").delete().eq("product_id", product_id).execute()
    if not items:
        return {"items": []}
    rows = []
    for it in items:
        colour = (it.get("colour") or it.get("color") or "").strip() or None
        size = (it.get("size") or "").strip() or None
        weight_raw = it.get("weight")
        has_weight = weight_raw is not None and str(weight_raw).strip() != ""
        # keep row if any identifying field or stock is set
        stock_val = int(it.get("stock_quantity") or it.get("stock") or 0)
        if not colour and not size and not has_weight and stock_val <= 0:
            continue
        row = {
            "product_id": product_id,
            "size": size,
            "colour": colour,
            "colour_hex": it.get("colour_hex") or it.get("color_hex") or None,
            "sku": it.get("sku") or None,
            "stock_quantity": int(it.get("stock_quantity") or it.get("stock") or 0),
            "price_adjustment": float(it.get("price_adjustment") or 0),
            "is_active": True,
        }
        # weight column if present in DB
        if it.get("weight") is not None and str(it.get("weight")).strip() != "":
            try:
                row["weight"] = float(it["weight"])
            except (TypeError, ValueError):
                row["weight"] = None
        rows.append(row)
    if not rows:
        return {"items": []}
    try:
        result = sb.table("product_variants").insert(rows).execute()
        return {"items": getattr(result, "data", None) or rows}
    except Exception as e:
        # retry without weight if column missing
        for r in rows:
            r.pop("weight", None)
        result = sb.table("product_variants").insert(rows).execute()
        return {"items": getattr(result, "data", None) or rows, "warning": str(e)}
