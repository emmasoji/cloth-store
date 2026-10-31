from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.paystack_service import verify_transaction
from app.services.supabase_client import get_supabase_admin

router = APIRouter()


class VerifyBody(BaseModel):
    reference: str


@router.post("/verify")
async def verify_payment(body: VerifyBody):
    """Backend verification — never trust frontend alone."""
    result = await verify_transaction(body.reference)
    if not result.get("status"):
        raise HTTPException(400, result.get("message", "Verification failed"))

    data = result.get("data", {})
    status = data.get("status")
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Database not configured")

    # Update payment
    payment_res = sb.table("payments").select("*").eq("reference", body.reference).maybe_single().execute()
    if not payment_res.data:
        raise HTTPException(404, "Payment not found")

    payment = payment_res.data
    if payment["status"] == "success":
        return {"status": "already_verified", "order_id": payment["order_id"]}

    new_status = "success" if status == "success" else "failed"
    sb.table("payments").update({
        "status": new_status,
        "paystack_reference": data.get("reference"),
        "channel": data.get("channel"),
        "paid_at": data.get("paid_at"),
        "metadata": data,
    }).eq("id", payment["id"]).execute()

    if new_status == "success":
        sb.table("orders").update({"status": "paid"}).eq("id", payment["order_id"]).execute()
        # TODO: deduct stock transactionally

    return {
        "status": new_status,
        "order_id": payment["order_id"],
        "amount": data.get("amount"),
        "currency": data.get("currency"),
    }