# from django.core.mail import send_mail
# from django.conf import settings
# from django.urls import reverse

# from django.utils.http import urlsafe_base64_encode
# from django.utils.encoding import force_bytes



# # from .utils import email_verification_token


# from django.contrib.auth.tokens import PasswordResetTokenGenerator
# import six

# # class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
# #     def _make_hash_value(self, user, timestamp):
# #         # return six.text_type(user.pk) + six.text_type(timestamp) + six.text_type(user.is_active)
# #         return six.text_type(user.pk) + six.text_type(timestamp)

# class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
#     def _make_hash_value(self, user, timestamp):
#         return f"{user.pk}{timestamp}{user.email}"


# email_verification_token = EmailVerificationTokenGenerator()



# def send_verification_email(user, request):
#     """
#     Sends a verification email with a unique token and uid encoded.
#     """
#     uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
#     token = email_verification_token.make_token(user)

#     verify_url = request.build_absolute_uri(
#         reverse("accounts:verify-email", kwargs={"uidb64": uidb64, "token": token})
#     )

#     subject = "Verify your SocialConnect account"
#     message = f"Hi {user.username},\n\nClick the link below to verify your account:\n{verify_url}"

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=False,
#     )




# from django.core.mail import send_mail
# from django.conf import settings
# from django.utils.http import urlsafe_base64_encode
# from django.utils.encoding import force_bytes
# from django.contrib.auth.tokens import PasswordResetTokenGenerator

# # ✅ Our token generator for email verification
# class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
#     def _make_hash_value(self, user, timestamp):
#         # Use pk, timestamp, and is_active so token changes after activation
#         return f"{user.pk}{timestamp}{user.is_active}"

# email_verification_token = EmailVerificationTokenGenerator()

# def send_verification_email(user, request=None):
#     """
#     Sends a verification email with uidb64 + token.
#     """
#     uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
#     token = email_verification_token.make_token(user)

#     FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
#     verify_url = f"{FRONTEND_URL}/verify-email/{uidb64}/{token}/"

#     subject = "Verify your SocialConnect account"
#     message = (
#         f"Hi {user.username},\n\n"
#         f"Thanks for registering at SocialConnect!\n"
#         f"Please click the link below to verify your account:\n\n"
#         f"{verify_url}\n\n"
#         f"If you didn’t register, just ignore this email."
#     )

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=False,
#     )

#     print("📧 Email verification link for", user.email, ":", verify_url)




from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator


# ✅ FIXED: don't include is_active in the hash
class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{timestamp}"   # only pk + timestamp


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

    print("📧 Email verification link for", user.email, ":", verify_url)







