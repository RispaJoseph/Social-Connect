from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from .models import Post, Like, Comment
from .serializers import PostSerializer, LikeSerializer, CommentSerializer
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .pagination import FeedPagination

class PostPagination(PageNumberPagination):
    page_size = 10  # number of posts per page
    page_size_query_param = 'page_size'
    max_page_size = 50

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = PostPagination

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PostRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if self.request.user != serializer.instance.author:
            raise PermissionDenied("You can only update your own posts")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.author:
            raise PermissionDenied("You can only delete your own posts")
        instance.is_active = False
        instance.save()



class LikePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = Post.objects.get(id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Already liked"}, status=status.HTTP_400_BAD_REQUEST)
        post.like_count += 1
        post.save()
        return Response({"detail": "Post liked"}, status=status.HTTP_201_CREATED)

    def delete(self, request, post_id):
        post = Post.objects.get(id=post_id)
        like = Like.objects.filter(user=request.user, post=post).first()
        if not like:
            return Response({"detail": "Not liked yet"}, status=status.HTTP_400_BAD_REQUEST)
        like.delete()
        post.like_count -= 1
        post.save()
        return Response({"detail": "Post unliked"}, status=status.HTTP_204_NO_CONTENT)


class LikeStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = Post.objects.get(id=post_id)
        liked = Like.objects.filter(user=request.user, post=post).exists()
        return Response({"liked": liked})


# --- Comment Views ---
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs["post_id"], is_active=True)

    def perform_create(self, serializer):
        post_id = self.kwargs["post_id"]
        comment = serializer.save(author=self.request.user, post_id=post_id)

        # Update comment count
        post = comment.post
        post.comment_count = post.comments.filter(is_active=True).count()
        post.save(update_fields=["comment_count"])


class CommentDeleteView(generics.DestroyAPIView):
    queryset = Comment.objects.all()
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author != request.user:
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        # Decrease comment count before deleting
        post = comment.post
        response = super().delete(request, *args, **kwargs)

        post.comment_count = post.comments.filter(is_active=True).count()
        post.save(update_fields=["comment_count"])

        return response
    

class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = FeedPagination

    def get_queryset(self):
        user = self.request.user
        # Get users the current user follows
        following_users = user.following.values_list("following", flat=True)
        # Posts from followed users + own posts
        return Post.objects.filter(
            Q(author__in=following_users) | Q(author=user)
        ).order_by("-created_at")