from rest_framework import serializers
from .models import Post
from PIL import Image
from supabase import create_client
import os


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.URLField(required=False)

    CATEGORY_CHOICES = ["general", "announcement", "question"]

    class Meta:
        model = Post
        fields = [
            "id", "content", "author", "author_username",
            "image", "image_url", "category", "is_active",
            "like_count", "comment_count", "created_at", "updated_at"
        ]
        read_only_fields = ["author", "like_count", "comment_count", "is_active",
                            "image_url", "created_at", "updated_at"]

    def validate(self, attrs):
        image = attrs.get("image")
        url = attrs.get("image_url")
        content = attrs.get("content")
        category = attrs.get("category", "general")

        # Ensure at least one or none is provided
        if image and url:
            raise serializers.ValidationError("Provide either an image file or image URL, not both.")

        # Validate image
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

        # Trim content to 280 characters
        if content:
            attrs["content"] = content[:280]

        # Validate category
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
