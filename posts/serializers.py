from rest_framework import serializers
from .models import Post, Like, Comment
from PIL import Image
from supabase import create_client
import os


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.URLField(required=False)

    # ✅ Add these so DRF knows to use your methods
    is_liked = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    CATEGORY_CHOICES = ["general", "announcement", "question"]

    class Meta:
        model = Post
        fields = [
            "id", "content", "author", "author_username",
            "image", "image_url", "category", "is_active",
            "like_count", "comment_count", "is_liked",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "author", "like_count", "comment_count", "is_active",
            "image_url", "created_at", "updated_at"
        ]

    def validate(self, attrs):
        image = attrs.get("image")
        url = attrs.get("image_url")
        content = attrs.get("content")
        category = attrs.get("category", "general")

        if image and url:
            raise serializers.ValidationError("Provide either an image file or image URL, not both.")

        if image:
            max_size = 2 * 1024 * 1024
            if image.size > max_size:
                raise serializers.ValidationError("Image size must be <= 2MB.")
            try:
                img = Image.open(image)
                if img.format not in ["JPEG", "PNG"]:
                    raise serializers.ValidationError("Only JPEG and PNG are allowed.")
            except IOError:
                raise serializers.ValidationError("Invalid image file.")

        if content:
            attrs["content"] = content[:280]

        if category not in self.CATEGORY_CHOICES:
            raise serializers.ValidationError(
                {"category": f"Invalid category. Choose from {self.CATEGORY_CHOICES}"}
            )

        return attrs

    def create(self, validated_data):
        image = validated_data.pop("image", None)
        image_url = validated_data.pop("image_url", None)
        post = Post.objects.create(**validated_data)

        if image:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            supabase = create_client(supabase_url, supabase_key)

            filename = f"posts/{post.id}_{image.name}"
            supabase.storage.from_("posts").upload(filename, image)
            image_url_data = supabase.storage.from_("posts").get_public_url(filename)
            post.image_url = image_url_data.public_url
        elif image_url:
            post.image_url = image_url

        post.save()
        return post

    # ✅ These methods will now be called automatically
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
