from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/posts/", include("posts.urls")),
    path('api/notifications/', include('notifications.urls')),
    path('api/admin/', include('adminpanel.urls')),

]
