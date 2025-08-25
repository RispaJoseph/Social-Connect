from django.urls import path
from .views import (
    UserListView, UserDetailView, DeactivateUserView,
    PostListView, PostDeleteView, StatsView
)

urlpatterns = [
    path('users/', UserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='admin-user-detail'),
    path('users/<int:user_id>/deactivate/', DeactivateUserView.as_view(), name='admin-user-deactivate'),
    path('posts/', PostListView.as_view(), name='admin-posts'),
    path('posts/<int:post_id>/', PostDeleteView.as_view(), name='admin-post-delete'),
    path('stats/', StatsView.as_view(), name='admin-stats'),
]
