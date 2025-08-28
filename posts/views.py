from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from django.db.models import Q, Exists, OuterRef
from django.shortcuts import get_object_or_404
from .models import Post, Like, Comment
from .serializers import PostSerializer, LikeSerializer, CommentSerializer
from .pagination import FeedPagination
from accounts.models import Follow 


class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = FeedPagination

    def get_queryset(self):
        user = self.request.user
        qs = Post.objects.all().order_by("-created_at")

        # Owners see their own posts (even if inactive); others see only active
        if user.is_authenticated:
            from django.db.models import Q
            qs = qs.filter(Q(is_active=True) | Q(author=user))
        else:
            qs = qs.filter(is_active=True)

        author_param = self.request.query_params.get("author")
        if author_param:
            if author_param == "me":
                return qs.filter(author=user) if user.is_authenticated else Post.objects.none()
            elif author_param.isdigit():
                qs = qs.filter(author_id=int(author_param))
            else:
                qs = qs.filter(author__username=author_param)

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(content__icontains=search)

        return qs


    def perform_create(self, serializer):
        # Keep using request in serializer (needed for upload_image)
        serializer.context["request"] = self.request
        serializer.save()  # serializer will set author=request.user


class PostRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # owners can access their own posts; others only active
        return Post.objects.filter(Q(is_active=True) | Q(author=user))

    def get_object(self):
        return get_object_or_404(self.get_queryset(), pk=self.kwargs["pk"])

    def perform_update(self, serializer):
        post = self.get_object()
        if post.author != self.request.user:
            raise PermissionDenied("You can only edit your own post.")
        serializer.context["request"] = self.request
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied("You can only delete your own post.")
        instance.delete()


class LikePostView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LikeSerializer

    def post(self, request, post_id):
        post = generics.get_object_or_404(Post, pk=self.kwargs["post_id"])
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            # toggle unlike
            like.delete()
            post.like_count = Like.objects.filter(post=post).count()
            post.save(update_fields=["like_count"])
            return Response({"detail": "Unliked", "like_count": post.like_count})
        post.like_count = Like.objects.filter(post=post).count()
        post.save(update_fields=["like_count"])
        serializer = self.get_serializer(like)
        return Response({"detail": "Liked", "like": serializer.data, "like_count": post.like_count}, status=status.HTTP_201_CREATED)


class LikeStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = generics.get_object_or_404(Post, pk=post_id)  # no is_active filter
        liked = Like.objects.filter(post=post, user=request.user).exists()
        return Response({"liked": liked}, status=status.HTTP_200_OK)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        post = generics.get_object_or_404(Post, pk=self.kwargs["post_id"])
        return post.comments.filter(is_active=True).order_by("-created_at")

    def perform_create(self, serializer):
        post = generics.get_object_or_404(Post, pk=self.kwargs["post_id"])
        serializer.context["request"] = self.request
        serializer.save(post=post)
        post.comment_count = post.comments.filter(is_active=True).count()
        post.save(update_fields=["comment_count"])



class CommentDeleteView(generics.DestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return generics.get_object_or_404(Comment, pk=self.kwargs["pk"], is_active=True)

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied("You can only delete your own comment.")
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        post = instance.post
        post.comment_count = post.comments.filter(is_active=True).count()
        post.save(update_fields=["comment_count"])



class FeedPagination(PageNumberPagination):
    page_size = 20          
    page_size_query_param = "page_size"
    max_page_size = 50


class FeedView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer
    pagination_class = FeedPagination

    def get_queryset(self):
        u = self.request.user
        following_ids = Follow.objects.filter(follower=u).values_list("following_id", flat=True)

        qs = (
            Post.objects
            .filter(
                Q(author_id__in=following_ids, is_active=True) 
                | Q(author=u)                                   
            )
            .select_related("author__profile")
            .order_by("-created_at", "-id")
            .annotate(
                liked_by_me=Exists(
                    Like.objects.filter(post_id=OuterRef("pk"), user=u)
                )
            )
        )
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


