from rest_framework import serializers
from .models import Post, Like, Comment
from PIL import Image
import io
from django.core.exceptions import ValidationError
from .supabase_service import upload_image
from django.db import transaction



ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png"}
MAX_IMAGE_BYTES = 2 * 1024 * 1024  


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.CharField(source="author.profile.avatar_url", read_only=True)
    image = serializers.SerializerMethodField(read_only=True)
    liked_by_me = serializers.SerializerMethodField()  

    
    upload_image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "author",
            "author_username",
            "author_avatar",
            "created_at",
            "updated_at",
            "image_url",
            "image",
            "upload_image",
            "category",
            "is_active",
            "like_count",
            "comment_count",
            "liked_by_me", 
        ]
        read_only_fields = [
            "id",
            "author",
            "author_username",
            "author_avatar",
            "created_at",
            "updated_at",
            "image_url",
            "like_count",
            "comment_count",
            "liked_by_me",  
            "is_active", 
        ]

    def get_image(self, obj: Post):
        return obj.image_url

    def get_liked_by_me(self, obj: Post) -> bool:
        """
        Prefer the DB annotation (from FeedView). If not present,
        fall back to a quick existence check for the current user.
        """
        annotated = getattr(obj, "liked_by_me", None)
        if annotated is not None:
            return bool(annotated)

        request = self.context.get("request")
        if not request or request.user.is_anonymous:
            return False
        return Like.objects.filter(post=obj, user=request.user).exists()

    def validate_upload_image(self, file):
        if not file:
            return file
        if file.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image too large (max 2MB).")
        content_type = getattr(file, "content_type", None) or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError("Only JPEG and PNG images are allowed.")
        
        try:
            im = Image.open(file)
            im.verify()
        except Exception:
            raise serializers.ValidationError("Invalid image file.")
        file.seek(0)
        return file

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        upload = validated_data.pop("upload_image", None)

        
        with transaction.atomic():
            post = Post.objects.create(author=user, is_active=True, **validated_data)

            if upload:
                content_type = getattr(upload, "content_type", "application/octet-stream")
                file_bytes = upload.read()
                try:
                    public_url = upload_image(
                        file_bytes=file_bytes,
                        filename=upload.name,
                        content_type=content_type,
                    )
                    post.image_url = public_url
                    post.save(update_fields=["image_url"])
                except Exception as e:
                    
                    raise serializers.ValidationError(
                        {"upload_image": f"Image upload error: {e}"}
                    )

        return post



    def update(self, instance: Post, validated_data):
        upload = validated_data.pop("upload_image", None)
        validated_data.pop("is_active", None)

        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if upload:
            content_type = getattr(upload, "content_type", "application/octet-stream")
            file_bytes = upload.read()
            try:
                public_url = upload_image(
                    file_bytes=file_bytes,
                    filename=upload.name,
                    content_type=content_type,
                )
                instance.image_url = public_url
            except Exception as e:
                raise serializers.ValidationError(
                    {"upload_image": f"Image upload error: {e}"}
                )

        instance.save()
        return instance
    


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "post", "user", "created_at"]
        read_only_fields = ["id", "post", "user", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "content", "author", "author_username", "post", "created_at"]
        read_only_fields = ["id", "author", "author_username", "post", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["author"] = request.user
        comment = super().create(validated_data)
        
        post = comment.post
        post.comment_count = post.comments.filter(is_active=True).count()
        post.save(update_fields=["comment_count"])
        return comment