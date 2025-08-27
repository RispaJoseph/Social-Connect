from django.urls import path
from .redirects import reset_redirect
from .views import (
    RegisterView, UserProfileView, PublicProfileView, LoginView, 
    VerifyEmailView, UserAvatarUploadView,
    PasswordResetView, PasswordResetConfirmView,
    ChangePasswordView, LogoutView,
    FollowUserView, UnfollowUserView, FollowersListView, FollowingListView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),

    path("verify-email/<uid>/<token>/", VerifyEmailView.as_view(), name="verify-email"),

    # User Profiles
    path("me/", UserProfileView.as_view(), name="my_profile"),
    path("<int:pk>/", PublicProfileView.as_view(), name="public_profile"),
    path("me/avatar/", UserAvatarUploadView.as_view(), name="me-avatar"),


    # Password Management
    path("password-reset/", PasswordResetView.as_view(), name="password_reset"),
    path("password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("password-reset-confirm/<uidb64>/<token>/", reset_redirect, name="reset-redirect"),

    # Follow System
    path("follow/<int:user_id>/", FollowUserView.as_view(), name="follow-user"),
    path("unfollow/<int:user_id>/", UnfollowUserView.as_view(), name="unfollow-user"),
    path("followers/<int:user_id>/", FollowersListView.as_view(), name="followers-list"),
    path("following/<int:user_id>/", FollowingListView.as_view(), name="following-list"),
    
]
