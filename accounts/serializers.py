from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from .models import Profile
from .models import Follow

User = get_user_model()


# -------------------------------------------------------------------
# USER REGISTRATION
# -------------------------------------------------------------------

class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "password")

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"],
        )


# -------------------------------------------------------------------
# PROFILE SERIALIZERS
# -------------------------------------------------------------------

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for public profiles (minimal)."""
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id", "bio", "avatar_url", "website", "location", "visibility",
            "followers_count", "following_count", "posts_count",
        ]

    def get_followers_count(self, obj):
        return 0  # placeholder until follower system is implemented

    def get_following_count(self, obj):
        return 0  # placeholder

    def get_posts_count(self, obj):
        return 0  # placeholder


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for authenticated user's profile (includes user info)."""
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id", "username", "email", "bio", "avatar_url", "website", "location",
            "followers_count", "following_count", "posts_count",
        ]

    def get_followers_count(self, obj):
        return 0  # placeholder

    def get_following_count(self, obj):
        return 0  # placeholder

    def get_posts_count(self, obj):
        return 0  # placeholder


# -------------------------------------------------------------------
# PASSWORD MANAGEMENT
# -------------------------------------------------------------------

class PasswordResetSerializer(serializers.Serializer):
    """Serializer for initiating password reset via email."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming reset and setting a new password."""
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            uid = smart_str(urlsafe_base64_decode(attrs["uidb64"]))
            self.user = User.objects.get(id=uid)
        except (DjangoUnicodeDecodeError, User.DoesNotExist):
            raise serializers.ValidationError({"uidb64": "Invalid UID"})

        if not PasswordResetTokenGenerator().check_token(self.user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired token"})

        return attrs

    def save(self, **kwargs):
        self.user.set_password(self.validated_data["new_password"])
        self.user.save()
        return self.user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password when authenticated."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Wrong password"})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# -------------------------------------------------------------------
# LOGOUT
# -------------------------------------------------------------------

class LogoutSerializer(serializers.Serializer):
    """Serializer for logging out and blacklisting refresh token."""
    refresh = serializers.CharField()




# -------------------------------------------------------------------
# FOLLOW SYSTEM
# -------------------------------------------------------------------



class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "created_at"]
        read_only_fields = ["follower", "created_at"]

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.IntegerField(source="followers.count", read_only=True)
    following_count = serializers.IntegerField(source="following.count", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "followers_count", "following_count"]
