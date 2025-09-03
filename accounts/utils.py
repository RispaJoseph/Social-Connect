from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator



class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{timestamp}"   


email_verification_token = EmailVerificationTokenGenerator()


def send_verification_email(user, request=None):
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{FRONTEND_URL}/verify-email/{uidb64}/{token}/"

    subject = "Verify your SocialConnect account"
    message = (
        f"Hi {user.username},\n\n"
        f"Thanks for registering at SocialConnect!\n"
        f"Please click the link below to verify your account:\n\n"
        f"{verify_url}\n\n"
        f"If you didn’t register, just ignore this email."
    )

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)

    print("Email verification link for", user.email, ":", verify_url)







