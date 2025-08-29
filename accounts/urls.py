# accounts/urls.py
from django.urls import path
from .redirects import reset_redirect
from .views import (
    RegisterView, UserProfileView, PublicProfileView, LoginView, 
    VerifyEmailView, UserAvatarUploadView,
    PasswordResetView, PasswordResetConfirmView,
    ChangePasswordView, LogoutView,
    FollowUserView, UnfollowUserView, FollowersListView, FollowingListView, SuggestedUsersView,
    PublicProfileByUsernameView, PublicUsersRootView,  
)
from rest_framework_simplejwt.views import TokenRefreshView

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # path("verify-email/<uid>/<token>/", VerifyEmailView.as_view(), name="verify-email"),
    path("verify-email/<uidb64>/<token>/", VerifyEmailView.as_view(), name="verify-email"),



    # Users root: list & search (?q=) and exact lookup via ?username=
    path("", PublicUsersRootView.as_view(), name="users-root"),  # NEW -> /api/users/

    # Current user
    path("me/", UserProfileView.as_view(), name="my_profile"),
    path("me/avatar/", UserAvatarUploadView.as_view(), name="me-avatar"),

    # Public profile by numeric id (existing)
    # path("<int:pk>/", PublicProfileView.as_view(), name="public_profile"),
    path("<int:user_id>/", PublicProfileView.as_view(), name="public_profile"),


    # Public profile by username (NEW) -> /api/users/by-username/<username>/
    path("by-username/<str:username>/", PublicProfileByUsernameView.as_view(), name="public_profile_by_username"),

    # Password Management
    path("password-reset/", PasswordResetView.as_view(), name="password_reset"),
    path("password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

    # Follow System
    path("follow/<int:user_id>/", FollowUserView.as_view(), name="follow-user"),
    path("unfollow/<int:user_id>/", UnfollowUserView.as_view(), name="unfollow-user"),
    path("followers/<int:user_id>/", FollowersListView.as_view(), name="followers-list"),
    path("following/<int:user_id>/", FollowingListView.as_view(), name="following-list"),
    path("suggestions/", SuggestedUsersView.as_view(), name="suggested-users"),

]
