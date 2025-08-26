# accounts/redirects.py (new small helper)
from django.conf import settings
from django.shortcuts import redirect

def reset_redirect(request, uidb64, token):
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return redirect(f"{frontend}/reset-password/{uidb64}/{token}/")
