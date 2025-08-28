# socialconnect/posts/supabase_service.py
from supabase import create_client
from django.conf import settings
from uuid import uuid4
import os

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
POSTS_BUCKET = getattr(settings, "SUPABASE_POSTS_BUCKET", "posts")

def upload_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    key = f"posts/{uuid4().hex}{ext}"
    file_options = {
        "contentType": str(content_type or "application/octet-stream"),
        "upsert": "true",  # string to avoid httpx header type issues
    }
    try:
        supabase.storage.from_(POSTS_BUCKET).upload(
            path=key, file=file_bytes, file_options=file_options
        )
    except Exception as e:
        # Re-raise so serializer can show a user-friendly message
        raise RuntimeError(f"Storage upload failed: {e}")
    return supabase.storage.from_(POSTS_BUCKET).get_public_url(key)
