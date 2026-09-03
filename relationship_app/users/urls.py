from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileUpdateView,
    RegisterView,
)


urlpatterns = [
    path(
        'register/',
        RegisterView.as_view(),
        name='register',
    ),
    path(
        'login/',
        TokenObtainPairView.as_view(),
        name='login',
    ),
    path(
        'token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh',
    ),
    path(
        'me/',
        MeView.as_view(),
        name='me',
    ),
    path(
        'profile/',
        ProfileUpdateView.as_view(),
        name='profile-update',
    ),
    path(
        'password-reset/',
        PasswordResetRequestView.as_view(),
        name='password-reset',
    ),
    path(
        'password-reset/confirm/',
        PasswordResetConfirmView.as_view(),
        name='password-reset-confirm',
    ),
]
