from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.utils.encoding import smart_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.utils.encoding import force_bytes



from .models import Profile
from .models import Follow
from posts.models import Post 

User = get_user_model()


# -------------------------------------------------------------------
# USER REGISTRATION
# -------------------------------------------------------------------

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "password")

    def create(self, validated_data):
        # Create inactive user initially
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"],
            # is_active=False  # user inactive until email verification
            is_active=True
        )

        # Generate email verification token
        token = PasswordResetTokenGenerator().make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        verification_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/verify-email/{uidb64}/{token}/"

        # Print verification link to console (you can send via email in production)
        print(f"Email verification link for {user.email}: {verification_link}")

        return user

    

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow login using username OR email."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        username_or_email = attrs.get("username")
        password = attrs.get("password")
        user = User.objects.filter(Q(username=username_or_email) | Q(email=username_or_email)).first()
        if user and user.check_password(password):
            attrs["username"] = user.username  # required by SimpleJWT
        return super().validate(attrs)


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
        return obj.followers_count   # use property from Profile model

    def get_following_count(self, obj):
        return obj.following_count   # use property from Profile model

    def get_posts_count(self, obj):
        return Post.objects.filter(author=obj.user).count()
    


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for authenticated user's profile (includes user info)."""
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    visibility = serializers.ChoiceField(
        choices=Profile.VISIBILITY_CHOICES, required=False
    )

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id", "username", "email", "bio", "avatar_url", "website", "location", "visibility",
            "followers_count", "following_count", "posts_count",
        ]

        read_only_fields = ["avatar_url", "followers_count", "following_count", "posts_count"]

    def validate_bio(self, value):
        """Ensure bio is at most 160 characters."""
        if value and len(value) > 160:
            raise serializers.ValidationError("Bio must be 160 characters or fewer.")
        return value


    def get_followers_count(self, obj):
        return obj.followers_count

    def get_following_count(self, obj):
        return obj.following_count

    def get_posts_count(self, obj):
        return Post.objects.filter(author=obj.user).count()


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
    avatar_url = serializers.CharField(source="profile.avatar_url", read_only=True)  # ✅ add this

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar_url", "followers_count", "following_count"]



