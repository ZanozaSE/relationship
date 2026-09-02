from rest_framework import serializers

from .models import CoupleMetric


class CoupleMetricSerializer(serializers.ModelSerializer):
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
