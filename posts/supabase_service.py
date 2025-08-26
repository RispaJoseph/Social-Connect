from supabase import create_client
from django.conf import settings

supabase_url = settings.SUPABASE_URL
supabase_key = settings.SUPABASE_KEY
supabase_bucket = settings.SUPABASE_BUCKET
supabase = create_client(supabase_url, supabase_key)

def upload_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Uploads a file to Supabase Storage and returns the public URL as a string.
    """
    supabase.storage.from_(supabase_bucket).upload(
        filename,
        file_bytes,
        {"content-type": content_type, "upsert": "true"}  # must be string
    )

    # Directly return the URL string
    public_url = supabase.storage.from_(supabase_bucket).get_public_url(filename)
    return public_url
