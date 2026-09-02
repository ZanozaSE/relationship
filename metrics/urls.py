from django.urls import path

from .views import MetricImportanceView, MyMetricsView


urlpatterns = [
    path('', MyMetricsView.as_view(), name='my_metrics'),
    path(
        '<int:metric_id>/importance/',
        MetricImportanceView.as_view(),
        name='metric_importance',
    ),
]
