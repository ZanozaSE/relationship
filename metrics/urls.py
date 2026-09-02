from django.urls import path

from .views import MyMetricsView


urlpatterns = [
    path('', MyMetricsView.as_view(), name='my_metrics'),
]