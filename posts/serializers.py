from rest_framework import serializers
from .models import Post, Like, Comment
from PIL import Image
from supabase import create_client
import os
import time
from django.conf import settings
from .supabase_service import upload_image
from accounts.serializers import ProfileSerializer



class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    image = serializers.SerializerMethodField()  
    author_profile = ProfileSerializer(source="author.profile", read_only=True)
    

    # ✅ Computed fields
    is_liked = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    CATEGORY_CHOICES = ["general", "announcement", "question"]

    class Meta:
        model = Post
        fields = [
            "id", "content", "author", "author_username", "author_profile",
            "image", "category", "is_active",
            "like_count", "comment_count", "is_liked",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "author", "like_count", "comment_count", "is_active",
            "created_at", "updated_at",
        ]

    def validate(self, attrs):
        image = self.context["request"].FILES.get("image")  # ✅ pick file from request.FILES
        content = attrs.get("content")
        category = attrs.get("category", "general")

        if image:
            max_size = 2 * 1024 * 1024  # 2 MB
            if image.size > max_size:
                raise serializers.ValidationError("Image size must be <= 2MB.")
            try:
                img = Image.open(image)
                if img.format not in ["JPEG", "PNG"]:
                    raise serializers.ValidationError("Only JPEG and PNG are allowed.")
            except IOError:
                raise serializers.ValidationError("Invalid image file.")

        if content:
            attrs["content"] = content[:280]  # Trim to 280 chars

        if category not in self.CATEGORY_CHOICES:
            raise serializers.ValidationError(
                {"category": f"Invalid category. Choose from {self.CATEGORY_CHOICES}"}
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        image = request.FILES.get("image")
        
        # Set author from request
        validated_data["author"] = request.user
        post = Post.objects.create(**validated_data)

        if image:
            filename = f"posts/{post.id}_{int(time.time())}_{image.name}"
            file_bytes = image.read()
            public_url = upload_image(file_bytes, filename, image.content_type)
            post.image_url = public_url
            post.save(update_fields=["image_url"])

        return post


    # ✅ SerializerMethodFields
    def get_image(self, obj):
        return obj.image_url if obj.image_url else None

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_comment_count(self, obj):
        return obj.comments.filter(is_active=True).count()

    def get_is_liked(self, obj):
        user = self.context.get("request").user
        if user and user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False
    

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "user", "post", "created_at"]
        read_only_fields = ["user", "post", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source="author.username")

    class Meta:
        model = Comment
        fields = ["id", "content", "author", "post", "created_at"]
        read_only_fields = ["id", "post", "author", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["author"] = request.user
        comment = super().create(validated_data)

        # increment post comment_count
        post = comment.post
        post.comment_count = post.comments.count()
        post.save(update_fields=["comment_count"])

        return comment
