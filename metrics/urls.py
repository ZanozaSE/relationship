from django.urls import path

from .views import (
    CreateMetricView,
    DeleteMetricView,
    MetricImportanceView,
    MetricValueHistoryView,
    MetricValueView,
    MyMetricsView,
    RelationshipSatisfactionHistoryView,
    RelationshipSatisfactionView,
)


urlpatterns = [
    path('', MyMetricsView.as_view(), name='my_metrics'),
    path('create/', CreateMetricView.as_view(), name='create_metric'),
    path(
        '<int:metric_id>/importance/',
        MetricImportanceView.as_view(),
        name='metric_importance',
    ),
    path(
        '<int:metric_id>/value/',
        MetricValueView.as_view(),
        name='metric_value',
    ),
    path(
        '<int:metric_id>/history/',
        MetricValueHistoryView.as_view(),
        name='metric_history',
    ),
    path(
        '<int:metric_id>/delete/',
        DeleteMetricView.as_view(),
        name='delete_metric',
    ),
    path(
        'satisfaction/',
        RelationshipSatisfactionView.as_view(),
        name='relationship_satisfaction',
    ),
    path(
        'satisfaction/history/',
        RelationshipSatisfactionHistoryView.as_view(),
        name='relationship_satisfaction_history',
    ),
]
