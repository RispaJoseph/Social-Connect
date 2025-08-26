from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response


from django.db.models import Q
from django.conf import settings


from .models import Post, Like, Comment
from .serializers import PostSerializer, LikeSerializer, CommentSerializer
from .pagination import FeedPagination
from .supabase_service import upload_image

import time



class PostPagination(generics.ListAPIView):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Post, Like, Comment
from .serializers import PostSerializer, LikeSerializer, CommentSerializer
from .pagination import FeedPagination
from .supabase_service import upload_image
import time

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = FeedPagination

    def perform_create(self, serializer):
        post = serializer.save(author=self.request.user)

        image = self.request.FILES.get("image")
        if image:
            file_bytes = image.read()
            filename = f"posts/{post.id}_{int(time.time())}_{image.name}"

            # Upload and get public URL
            public_url = upload_image(file_bytes, filename, image.content_type)
            post.image_url = public_url
            post.save(update_fields=["image_url"])




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


class LikePostView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = Post.objects.get(id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            return Response({"detail": "Already liked"}, status=400)
        post.like_count += 1
        post.save()
        return Response({"detail": "Post liked"}, status=201)

    def delete(self, request, post_id):
        post = Post.objects.get(id=post_id)
        like = Like.objects.filter(user=request.user, post=post).first()
        if not like:
            return Response({"detail": "Not liked yet"}, status=400)
        like.delete()
        post.like_count -= 1
        post.save()
        return Response({"detail": "Post unliked"}, status=204)


class LikeStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = Post.objects.get(id=post_id)
        liked = Like.objects.filter(user=request.user, post=post).exists()
        return Response({"liked": liked})


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
            return Response({"detail": "Not allowed"}, status=403)

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
        following_users = user.following.values_list("following", flat=True)
        return Post.objects.filter(
            Q(author__in=following_users) | Q(author=user)
        ).order_by("-created_at")
