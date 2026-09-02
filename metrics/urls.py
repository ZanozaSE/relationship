from django.urls import path

from .views import (
    MetricImportanceView,
    MetricValueHistoryView,
    MetricValueView,
    MyMetricsView,
    RelationshipSatisfactionView,
)


urlpatterns = [
    path('', MyMetricsView.as_view(), name='my_metrics'),
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
        'satisfaction/',
        RelationshipSatisfactionView.as_view(),
        name='relationship_satisfaction',
    ),
]
