from django.urls import path
from .views import NotificationListCreateView, mark_as_read, mark_all_read

urlpatterns = [
    path('', NotificationListCreateView.as_view(), name='notifications-list'),
    path('<int:notification_id>/read/', mark_as_read, name='notification-read'),
    path('mark-all-read/', mark_all_read, name='mark-all-read'),
]
