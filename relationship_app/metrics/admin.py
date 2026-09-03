from django.contrib import admin

from .models import MetricTemplate, CoupleMetric, MetricValue


@admin.register(MetricTemplate)
class MetricTemplateAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'scale_type',
        'min_value',
        'max_value',
        'target_value',
        'is_active',
    )

    list_filter = (
        'scale_type',
        'is_active',
    )


@admin.register(CoupleMetric)
class CoupleMetricAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'couple',
        'scale_type',
        'is_active',
        'created_at',
    )

    list_filter = (
        'scale_type',
        'is_active',
    )


@admin.register(MetricValue)
class MetricValueAdmin(admin.ModelAdmin):
    list_display = (
        'metric',
        'user',
        'value',
        'created_at',
    )

    list_filter = (
        'created_at',
    )