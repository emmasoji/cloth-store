from fastapi import APIRouter, Request, HTTPException, Header
from app.services.paystack_service import verify_webhook_signature
from app.services.supabase_client import get_supabase_admin
import logging

router = APIRouter()
logger = logging.getLogger("neon.webhooks")


@router.post("/paystack")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: str = Header(None, alias="x-paystack-signature"),
):
    body = await request.body()
    if not verify_webhook_signature(body, x_paystack_signature or ""):
        raise HTTPException(401, "Invalid signature")

    import json
    event = json.loads(body)
    event_type = event.get("event")
    data = event.get("data", {})
    reference = data.get("reference")

    logger.info("Paystack webhook: %s ref=%s", event_type, reference)

    sb = get_supabase_admin()
    if not sb or not reference:
        return {"received": True}

    payment_res = sb.table("payments").select("*").eq("reference", reference).maybe_single().execute()
    if not payment_res.data:
        return {"received": True}

    payment = payment_res.data

    # Idempotent
    if payment["status"] == "success" and event_type == "charge.success":
        return {"received": True, "note": "already processed"}

    if event_type == "charge.success":
        sb.table("payments").update({
            "status": "success",
            "paystack_reference": data.get("reference"),
            "channel": data.get("channel"),
            "paid_at": data.get("paid_at"),
            "metadata": data,
        }).eq("id", payment["id"]).execute()
        sb.table("orders").update({"status": "paid"}).eq("id", payment["order_id"]).execute()
        sb.table("payment_events").insert({
            "payment_id": payment["id"],
            "event_type": event_type,
            "payload": event,
        }).execute()
        # Inventory: deduct the specific variant (size/colour) sold
        try:
            items_res = (
                sb.table("order_items")
                .select("id, product_id, variant_id, quantity, size, colour")
                .eq("order_id", payment["order_id"])
                .execute()
            )
            items = getattr(items_res, "data", None) or []
            for it in items:
                qty = int(it.get("quantity") or 0)
                if qty <= 0:
                    continue
                vid = it.get("variant_id")
                pid = it.get("product_id")
                if vid:
                    vres = (
                        sb.table("product_variants")
                        .select("id, stock_quantity")
                        .eq("id", vid)
                        .limit(1)
                        .execute()
                    )
                    vrows = getattr(vres, "data", None) or []
                    if vrows:
                        current = int(vrows[0].get("stock_quantity") or 0)
                        new_stock = max(0, current - qty)
                        sb.table("product_variants").update({"stock_quantity": new_stock}).eq("id", vid).execute()
                if pid:
                    pres = (
                        sb.table("products")
                        .select("id, stock_quantity")
                        .eq("id", pid)
                        .limit(1)
                        .execute()
                    )
                    prows = getattr(pres, "data", None) or []
                    if prows:
                        current = int(prows[0].get("stock_quantity") or 0)
                        new_stock = max(0, current - qty)
                        sb.table("products").update({"stock_quantity": new_stock}).eq("id", pid).execute()
        except Exception as inv_err:
            logger.exception("Inventory deduction failed: %s", inv_err)


    elif event_type in ("charge.failed", "transfer.failed"):
        sb.table("payments").update({"status": "failed"}).eq("id", payment["id"]).execute()
        sb.table("orders").update({"status": "payment_failed"}).eq("id", payment["order_id"]).execute()

    return {"received": True}