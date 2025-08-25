from rest_framework import serializers
from django.contrib.auth import get_user_model

from posts.models import Post
from notifications.models import Notification

User = get_user_model()


# -------------------- USER SERIALIZER --------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "is_staff"]


# -------------------- POST SERIALIZER --------------------
class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Post
        fields = ["id", "author", "content", "created_at", "updated_at"]


# -------------------- NOTIFICATION SERIALIZER --------------------
class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "recipient", "message", "is_read", "created_at"]
