from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.api import (
    products,
    categories,
    collections,
    cart,
    orders,
    checkout,
    payments,
    webhooks,
    tracking,
    shipping,
    discounts,
    analytics,
    admin,
    settings as settings_api,
    media,
    newsletter,
    currency,
    auth,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neon")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NEON API starting...")
    if not settings.supabase_url:
        logger.warning("SUPABASE_URL not set — some features will be unavailable")
    if not settings.paystack_secret_key:
        logger.warning("PAYSTACK_SECRET_KEY not set — payments disabled")
    yield
    logger.info("NEON API shutting down")


app = FastAPI(
    title="NEON E-Commerce API",
    description="Premium thrift & streetwear platform API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "supabase_configured": bool(settings.supabase_url),
        "paystack_configured": bool(settings.paystack_secret_key),
        "environment": settings.environment,
    }


# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(collections.router, prefix="/api/collections", tags=["Collections"])
app.include_router(cart.router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(checkout.router, prefix="/api/checkout", tags=["Checkout"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["Tracking"])
app.include_router(shipping.router, prefix="/api/shipping", tags=["Shipping"])
app.include_router(discounts.router, prefix="/api/discounts", tags=["Discounts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["Settings"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(newsletter.router, prefix="/api/newsletter", tags=["Newsletter"])
app.include_router(currency.router, prefix="/api/currency", tags=["Currency"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)