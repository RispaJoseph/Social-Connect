from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

# post_save - runs after a User object is created or updated.(Signal of the User model,)
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Ensure a Profile always exists for every User (even inactive ones).
    """
    if created:
        Profile.objects.get_or_create(user=instance)
    else:
        
        Profile.objects.get_or_create(user=instance)
        instance.profile.save()
