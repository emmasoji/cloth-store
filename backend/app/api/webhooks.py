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
        # TODO: inventory deduction

    elif event_type in ("charge.failed", "transfer.failed"):
        sb.table("payments").update({"status": "failed"}).eq("id", payment["id"]).execute()
        sb.table("orders").update({"status": "payment_failed"}).eq("id", payment["order_id"]).execute()

    return {"received": True}