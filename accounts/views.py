from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_str, force_bytes, smart_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from rest_framework import serializers
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.tokens import default_token_generator
from .utils import send_verification_email, email_verification_token


import logging
logger = logging.getLogger("django")



from rest_framework import generics, permissions, status
from rest_framework.generics import (
    RetrieveAPIView,
    ListAPIView,
    CreateAPIView,
    RetrieveUpdateAPIView,
    ListAPIView,
)

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied,  NotFound

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from supabase import create_client
from uuid import uuid4
import os



from .models import Profile
from .models import Follow
from .serializers import (
    UserRegisterSerializer, ProfileSerializer, UserProfileSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    ChangePasswordSerializer, LogoutSerializer,
    FollowSerializer, UserSerializer, CustomTokenObtainPairSerializer
)

User = get_user_model()


# ---------------- REGISTER ----------------


logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  

        
        user = serializer.save(is_active=False)

        
        send_verification_email(user, request)

        logger.info("User registered (inactive): %s", user.username)
        return Response(
            {"detail": "Registration successful! Please check your email to verify your account."},
            status=status.HTTP_201_CREATED,
        )





class DebugRegisterView(APIView):                #for debugging (prints link in console instead of sending)
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            serializer = UserRegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

           
            user = serializer.save(is_active=False)

            send_verification_email(user, request)

            return Response(
                {"detail": "Registration successful! Please check your email to verify your account."},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



# ---------------- LOGIN ----------------
@method_decorator(csrf_exempt, name="dispatch")
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
       
        return super().post(request, *args, **kwargs)




class TokenRefreshViewCustom(TokenRefreshView):
    """Refresh JWT token."""
    pass



class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = get_object_or_404(User, pk=uid)
            print("Found user:", user.email, "is_active:", user.is_active)
        except Exception:
            return Response({"error": "Invalid link."}, status=400)

        if email_verification_token.check_token(user, token):
            user.is_active = True
            user.save(update_fields=["is_active"])
            return Response({"detail": "Email verified successfully."}, status=200)

        return Response({"error": "Invalid or expired token."}, status=400)






# --------------------------
# USER PROFILES
# --------------------------


supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
bucket = settings.SUPABASE_AVATAR_BUCKET

class UserAvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("avatar")
        if not file_obj:
            return Response({"detail": "No file 'avatar' provided."}, status=400)

        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        bucket = settings.SUPABASE_AVATAR_BUCKET

        
        ext = os.path.splitext(file_obj.name)[1].lower()
        key = f"user_{request.user.id}/{uuid4().hex}{ext}"

        
        data = file_obj.read()
        supabase.storage.from_(bucket).upload(
            path=key,
            file=data,
            file_options={"contentType": file_obj.content_type, "upsert": "true"},
        )

        
        public_url = supabase.storage.from_(bucket).get_public_url(key)

        
        profile = request.user.profile
        profile.avatar_url = public_url
        profile.save(update_fields=["avatar_url"])

        return Response({"avatar_url": public_url}, status=200)
    


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update authenticated user's profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class PublicProfileView(generics.RetrieveAPIView):
    queryset = Profile.objects.select_related("user")
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_url_kwarg = "user_id"

    def get_object(self):
        user_id = self.kwargs.get(self.lookup_url_kwarg)
        profile = get_object_or_404(self.queryset, user__id=user_id)

        
        vis = profile.visibility
        req_user = self.request.user if self.request.user.is_authenticated else None

        if vis == Profile.VIS_PRIVATE:
            if not req_user or req_user.id != profile.user_id and not req_user.is_staff:
                raise PermissionDenied("This profile is private.")
        elif vis == Profile.VIS_FOLLOWERS:
            if not req_user:
                raise PermissionDenied("Followers only.")
            if req_user.id != profile.user_id and not req_user.is_staff:
                is_follower = Follow.objects.filter(following=profile.user, follower=req_user).exists()
                if not is_follower:
                    raise PermissionDenied("Followers only.")

        return profile



class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().select_related("profile")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["username", "email"]
    ordering_fields = ["date_joined", "username"]
    ordering = ["-date_joined"]


# --------------------------
# PASSWORD MANAGEMENT
# --------------------------

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")

class PasswordResetView(APIView):
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

        
        reset_link = f"{FRONTEND_URL}/reset-password/{uidb64}/{token}/"

        
        send_mail(
            subject="Password Reset Request",
            message=f"Click the link to reset your password: {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )
        print("Password reset link:", reset_link)  

        return Response({"message": "Password reset link sent to email"})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        
        data = request.data.copy()
        data["uidb64"] = uidb64
        data["token"] = token

        serializer = PasswordResetConfirmSerializer(data=data)
        serializer.is_valid(raise_exception=True)

       
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"message": "Password has been reset successfully"}, status=status.HTTP_200_OK)


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

class SuggestedUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ("id", "username", "avatar_url")  
    
    def get_avatar_url(self, obj):
        
        if hasattr(obj, "avatar_url"):
            return obj.avatar_url

       
        prof = getattr(obj, "profile", None)
        if prof and hasattr(prof, "avatar_url"):
            return prof.avatar_url

        
        if hasattr(obj, "avatar") and getattr(obj, "avatar"):
            try:
                return obj.avatar.url
            except Exception:
                pass
        if prof and hasattr(prof, "avatar") and getattr(prof, "avatar"):
            try:
                return prof.avatar.url
            except Exception:
                pass

        return None


class SuggestionsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class SuggestedUsersView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SuggestedUserSerializer
    pagination_class = SuggestionsPagination

    def get_queryset(self):
        me = self.request.user

        # ---- Pick ONE depending on your follow model ----
        following_ids = Follow.objects.filter(follower=me).values_list("following_id", flat=True)
        # following_ids = me.following.values_list("id", flat=True) 

        q = self.request.query_params.get("q")
        qs = (
            User.objects.filter(is_active=True)
            .exclude(id=me.id)
            .exclude(id__in=following_ids)
            .exclude(is_staff=True)   
            .exclude(is_superuser=True)  
            .order_by("-last_login", "-date_joined")
        )
        if q:
            qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))
        return qs










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
        user = get_object_or_404(User, id=self.kwargs["user_id"])
        return User.objects.select_related("profile").filter(
            id__in=user.followers.values_list("follower", flat=True)
        )



class FollowingListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs["user_id"])
        return User.objects.select_related("profile").filter(
            id__in=user.following.values_list("following", flat=True)
        )




class PublicUsersRootView(ListAPIView):
    """
    GET /api/users/                -> list first 50 (limited fields)
    GET /api/users/?q=rose        -> search usernames (icontains)
    GET /api/users/?username=rose -> exact username (returns 1 or 404)
    """
    permission_classes = [AllowAny]
    serializer_class = ProfileSerializer  # minimal public serializer

    def get_queryset(self):
        qs = Profile.objects.select_related("user").filter(user__is_active=True)

        username = self.request.query_params.get("username")
        q = self.request.query_params.get("q")

        if username:
            obj = qs.filter(user__username__iexact=username).first()
            if not obj:
                raise NotFound("User not found.")
            # Return a queryset with only this one object
            return Profile.objects.filter(pk=obj.pk)

        if q:
            return qs.filter(user__username__icontains=q)[:20]

        # default list (keep it small)
        return qs.order_by("user__username")[:50]


class PublicProfileByUsernameView(RetrieveAPIView):
    """
    GET /api/users/by-username/<username>/
    """
    permission_classes = [AllowAny]
    serializer_class = ProfileSerializer  # public-safe fields

    def get_object(self):
        username = self.kwargs.get("username")
        profile = get_object_or_404(
            Profile.objects.select_related("user").filter(user__is_active=True),
            user__username__iexact=username,
        )

        # Enforce visibility (reuse your logic)
        vis = profile.visibility
        req_user = self.request.user if self.request.user.is_authenticated else None

        if vis == Profile.VIS_PRIVATE:
            if not req_user or (req_user.id != profile.user_id and not req_user.is_staff):
                raise PermissionDenied("This profile is private.")
        elif vis == Profile.VIS_FOLLOWERS:
            if not req_user:
                raise PermissionDenied("Followers only.")
            if req_user.id != profile.user_id and not req_user.is_staff:
                is_follower = Follow.objects.filter(following=profile.user, follower=req_user).exists()
                if not is_follower:
                    raise PermissionDenied("Followers only.")

        return profile