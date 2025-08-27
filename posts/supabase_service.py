# socialconnect/posts/supabase_service.py
from supabase import create_client
from django.conf import settings
from uuid import uuid4
import os

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
POSTS_BUCKET = getattr(settings, "SUPABASE_POSTS_BUCKET", "posts")

def upload_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Upload bytes to Supabase Storage and return a public URL.
    Assumes the POSTS bucket is public. If private, return a signed URL instead.
    """
    # unique key per upload
    ext = os.path.splitext(filename)[1].lower()
    key = f"posts/{uuid4().hex}{ext}"

    # v2 client: file_options uses 'contentType' and 'upsert'
    supabase.storage.from_(POSTS_BUCKET).upload(
        path=key,
        file=file_bytes,
        file_options={"contentType": content_type, "upsert": True},
    )

    # Public URL (bucket must be public)
    public_url = supabase.storage.from_(POSTS_BUCKET).get_public_url(key)
    return public_url
