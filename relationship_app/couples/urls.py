from django.urls import path

from .views import (
    CreateCoupleView,
    JoinCoupleView,
    MyCoupleView,
)


urlpatterns = [
    path(
        '',
        CreateCoupleView.as_view(),
        name='create-couple',
    ),

    path(
        'join/',
        JoinCoupleView.as_view(),
        name='join-couple',
    ),

    path(
        'me/',
        MyCoupleView.as_view(),
        name='my-couple',
    ),
]