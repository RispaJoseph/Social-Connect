from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.conf import settings

class User(AbstractUser):
    username_validator = RegexValidator(
        regex=r"^[A-Za-z0-9_]{3,30}$",
        message="Username must be 3-30 chars, alphanumeric + underscore.",
    )

    username = models.CharField(
        max_length=30,
        unique=True,
        validators=[username_validator],
    )
    email = models.EmailField(unique=True)

    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.username





class Profile(models.Model):
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
        ("followers_only", "Followers Only"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    bio = models.CharField(max_length=160, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default="public"
    )

    followers = models.ManyToManyField(
        User, related_name="following_profiles", blank=True
    )

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def followers_count(self):
        return 0

    @property
    def following_count(self):
        return 0

    @property
    def posts_count(self):
        return 0
