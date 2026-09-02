from rest_framework import serializers

from .models import CoupleMetric, MetricImportance


class CoupleMetricSerializer(serializers.ModelSerializer):
    importance = serializers.SerializerMethodField()

    class Meta:
        model = CoupleMetric
        fields = (
            'id',
            'name',
            'scale_type',
            'min_value',
            'max_value',
            'target_value',
            'left_label',
            'right_label',
            'sort_order',
            'importance',
        )

    def get_importance(self, obj):
        user = self.context['request'].user
        importance = obj.importance_settings.filter(user=user).first()
        return importance.importance if importance else 100
