import httpx
from app.config import settings
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger("neon.paystack")

BASE_URL = "https://api.paystack.co"


async def initialize_transaction(
    email: str,
    amount: int,
    reference: str,
    currency: str = "NGN",
    metadata: Optional[Dict] = None,
) -> Dict[str, Any]:
    if not settings.paystack_secret_key:
        logger.warning("Paystack not configured — returning mock")
        return {
            "status": False,
            "message": "Paystack not configured",
            "data": {
                "authorization_url": None,
                "access_code": "MOCK_ACCESS",
                "reference": reference,
            },
        }

    headers = {
        "Authorization": f"Bearer {settings.paystack_secret_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "amount": amount,
        "reference": reference,
        "currency": currency,
        "metadata": metadata or {},
        "callback_url": f"{settings.frontend_url}/order/confirmation",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/transaction/initialize", json=payload, headers=headers)
        data = resp.json()
        if not data.get("status"):
            logger.error("Paystack init failed: %s", data)
        return data


async def verify_transaction(reference: str) -> Dict[str, Any]:
    if not settings.paystack_secret_key:
        return {"status": False, "message": "Paystack not configured"}

    headers = {"Authorization": f"Bearer {settings.paystack_secret_key}"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/transaction/verify/{reference}", headers=headers)
        return resp.json()


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    import hmac
    import hashlib
    if not settings.paystack_webhook_secret:
        return False
    computed = hmac.new(
        settings.paystack_webhook_secret.encode(),
        payload,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(computed, signature)