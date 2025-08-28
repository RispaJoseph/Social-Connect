from django.urls import path
from .views import (
    PostListCreateView,
    PostRetrieveUpdateDeleteView,
    LikePostView,
    LikeStatusView,
    CommentListCreateView,
    CommentDeleteView,
    FeedView,
)

urlpatterns = [
    path("", PostListCreateView.as_view(), name="post-list-create"),
    path("<int:pk>/", PostRetrieveUpdateDeleteView.as_view(), name="post-detail"),
    path("<int:post_id>/like/", LikePostView.as_view(), name="like-post"),
    path("<int:post_id>/like-status/", LikeStatusView.as_view(), name="like-status"),
    path("<int:post_id>/comments/", CommentListCreateView.as_view(), name="comments"),
    path("comments/<int:pk>/", CommentDeleteView.as_view(), name="delete-comment"),
    path("feed/", FeedView.as_view(), name="feed"),
]