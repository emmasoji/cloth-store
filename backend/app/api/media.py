from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.supabase_client import get_supabase_admin
import uuid
import re

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024


def _safe_folder(folder: str) -> str:
    """Keep only safe path segments: uuid or slug-like names."""
    folder = (folder or "").strip().strip("/")
    if not folder:
        return "general"
    # allow uuid or alphanumeric-dash segments only
    parts = []
    for p in folder.split("/"):
        p = re.sub(r"[^a-zA-Z0-9_-]", "", p)
        if p:
            parts.append(p[:64])
    return "/".join(parts) if parts else "general"


@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    bucket: str = Form("products"),
    folder: str = Form(""),
    product_id: str = Form(""),
):
    """
    Upload image to Supabase Storage.
    Prefer product_id so files land in products/{product_id}/...
    and stay isolated per product.
    """
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Storage not configured")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, "File too large (max 5MB)")

    content_type = file.content_type or "image/jpeg"
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP, GIF allowed")

    ext = (file.filename or "img.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"

    if product_id:
        # products/{uuid}/filename — isolated per product
        safe_id = re.sub(r"[^a-fA-F0-9-]", "", product_id)[:36] or "unknown"
        path = f"{safe_id}/{uuid.uuid4().hex}.{ext}"
        folder_meta = f"products/{safe_id}"
    else:
        folder_meta = _safe_folder(folder)
        path = f"{folder_meta}/{uuid.uuid4().hex}.{ext}"

    try:
        sb.storage.from_(bucket).upload(
            path,
            content,
            {"content-type": content_type, "upsert": "false"},
        )
        public = sb.storage.from_(bucket).get_public_url(path)
        # supabase-py sometimes returns dict-like or string
        url = public if isinstance(public, str) else getattr(public, "public_url", None) or str(public)

        try:
            sb.table("media_assets").insert({
                "filename": file.filename,
                "url": url,
                "bucket": bucket,
                "mime_type": content_type,
                "size_bytes": len(content),
                "folder": folder_meta,
            }).execute()
        except Exception:
            pass  # non-fatal if media_assets insert fails

        return {
            "url": url,
            "path": path,
            "bucket": bucket,
            "folder": folder_meta,
            "product_id": product_id or None,
        }
    except Exception as e:
        raise HTTPException(500, str(e))
