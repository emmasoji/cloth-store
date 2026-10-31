from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.supabase_client import get_supabase_admin
from app.config import settings
import uuid

router = APIRouter()


@router.post("/upload")
async def upload_media(file: UploadFile = File(...), bucket: str = "products", folder: str = ""):
    sb = get_supabase_admin()
    if not sb:
        raise HTTPException(503, "Storage not configured")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 5MB)")
    ext = (file.filename or "img").split(".")[-1]
    path = f"{folder}/{uuid.uuid4().hex}.{ext}" if folder else f"{uuid.uuid4().hex}.{ext}"
    try:
        sb.storage.from_(bucket).upload(path, content, {"content-type": file.content_type or "image/jpeg"})
        url = sb.storage.from_(bucket).get_public_url(path)
        # Record in media_assets
        sb.table("media_assets").insert({
            "filename": file.filename,
            "url": url,
            "bucket": bucket,
            "mime_type": file.content_type,
            "size_bytes": len(content),
            "folder": folder,
        }).execute()
        return {"url": url, "path": path, "bucket": bucket}
    except Exception as e:
        raise HTTPException(500, str(e))