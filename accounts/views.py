from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Profile
from .models import Follow
from .serializers import (
    UserRegisterSerializer, ProfileSerializer, UserProfileSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    ChangePasswordSerializer, LogoutSerializer,
    FollowSerializer, UserSerializer
)

User = get_user_model()


# --------------------------
# USER REGISTRATION & AUTH
# --------------------------

class RegisterView(generics.CreateAPIView):
    """Register a new user."""
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer


class LoginView(TokenObtainPairView):
    """User login with JWT."""
    pass


class TokenRefreshViewCustom(TokenRefreshView):
    """Refresh JWT token."""
    pass


# --------------------------
# USER PROFILES
# --------------------------

class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update authenticated user's profile."""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class PublicProfileView(generics.RetrieveAPIView):
    """Retrieve any public profile by user ID."""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "pk"


# --------------------------
# PASSWORD MANAGEMENT
# --------------------------

class PasswordResetView(APIView):
    """Send password reset link to user's email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist"}, status=400)

        token_generator = PasswordResetTokenGenerator()
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        reset_link = f"http://127.0.0.1:8000/api/auth/password-reset-confirm/{uidb64}/{token}/"

        send_mail(
            subject="Password Reset Request",
            message=f"Click the link to reset your password: {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "Password reset link sent to email"})


class PasswordResetConfirmView(APIView):
    """Confirm password reset using token and set new password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data={
            "uidb64": uidb64,
            "token": token,
            "new_password": request.data.get("password")
        })
        serializer.is_valid(raise_exception=True)

        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"message": "Password has been reset successfully"})


class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password changed successfully"})


# --------------------------
# LOGOUT
# --------------------------

class LogoutView(APIView):
    """Logout user by blacklisting their refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=205)
        except Exception:
            return Response({"error": "Invalid token"}, status=400)
        


# --------------------------
# FOLLOW SYSTEM
# --------------------------

class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            user_to_follow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user_to_follow == request.user:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)

        follow, created = Follow.objects.get_or_create(follower=request.user, following=user_to_follow)

        if not created:
            return Response({"message": "Already following"}, status=status.HTTP_200_OK)

        return Response({"message": f"You are now following {user_to_follow.username}"}, status=status.HTTP_201_CREATED)


class UnfollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            user_to_unfollow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            follow = Follow.objects.get(follower=request.user, following=user_to_unfollow)
            follow.delete()
            return Response({"message": f"You unfollowed {user_to_unfollow.username}"}, status=status.HTTP_200_OK)
        except Follow.DoesNotExist:
            return Response({"error": "You are not following this user"}, status=status.HTTP_400_BAD_REQUEST)


class FollowersListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = User.objects.get(id=self.kwargs["user_id"])
        # Get actual User objects instead of IDs
        return User.objects.filter(id__in=user.followers.values_list("follower", flat=True))


class FollowingListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = User.objects.get(id=self.kwargs["user_id"])
        # Get actual User objects instead of IDs
        return User.objects.filter(id__in=user.following.values_list("following", flat=True))