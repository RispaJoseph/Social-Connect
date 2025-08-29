from django.contrib.auth import get_user_model
from django.utils.timezone import now
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from posts.models import Post
from .serializers import UserSerializer, PostSerializer

User = get_user_model()


# ---- Permissions ----
class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin (is_staff=True) users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


# ---- User Management ----

class AdminPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class UserListView(generics.ListAPIView):
    queryset = User.objects.filter(is_superuser=False, is_staff=False)
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPageNumberPagination


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class DeactivateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            user.is_active = False
            user.save()
            return Response({"detail": "User deactivated successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)



class ActivateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            user.is_active = True
            user.save()
            return Response({"detail": "User activated successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)



# ---- Post Management ----
class PostListView(generics.ListAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAdminUser]


class PostDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(pk=post_id)
            post.delete()
            return Response({"detail": "Post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)


# ---- Stats ----
class StatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_posts = Post.objects.count()
        active_today = User.objects.filter(last_login__date=now().date()).count()

        return Response({
            "total_users": total_users,
            "total_posts": total_posts,
            "active_today": active_today,
        })
