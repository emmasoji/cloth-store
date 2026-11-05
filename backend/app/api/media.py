from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.supabase_client import get_supabase_admin
import uuid
import re

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/heic",
    "image/heif",
}
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"}
EXT_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
    "avif": "image/avif",
    "heic": "image/heic",
    "heif": "image/heif",
}
MAX_BYTES = 8 * 1024 * 1024


def _safe_folder(folder: str) -> str:
    folder = (folder or "").strip().strip("/")
    if not folder:
        return "general"
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
    """Upload to Supabase Storage. Accepts JPEG, PNG, WebP, GIF, AVIF."""
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Storage not configured")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, "File too large (max 8MB)")

    filename = file.filename or "img.jpg"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    content_type = (file.content_type or "").lower().strip()

    # AVIF often arrives as octet-stream or empty MIME — trust file extension
    if content_type not in ALLOWED_TYPES:
        if ext in ALLOWED_EXT:
            content_type = EXT_TO_MIME[ext]
        else:
            raise HTTPException(400, "Only JPEG, PNG, WebP, GIF, AVIF allowed")

    if ext not in ALLOWED_EXT:
        rev = {v: k for k, v in EXT_TO_MIME.items()}
        ext = rev.get(content_type, "jpg")

    if product_id:
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
        url = public if isinstance(public, str) else getattr(public, "public_url", None) or str(public)

        try:
            sb.table("media_assets").insert({
                "filename": filename,
                "url": url,
                "bucket": bucket,
                "mime_type": content_type,
                "size_bytes": len(content),
                "folder": folder_meta,
            }).execute()
        except Exception:
            pass

        return {
            "url": url,
            "path": path,
            "bucket": bucket,
            "folder": folder_meta,
            "product_id": product_id or None,
        }
    except Exception as e:
        raise HTTPException(500, str(e))
