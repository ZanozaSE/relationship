from rest_framework import serializers

from .models import CoupleMetric, MetricImportance, MetricValue


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


class MetricImportanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricImportance
        fields = ('importance',)

    def validate_importance(self, value):
        if not 0 <= value <= 200:
            raise serializers.ValidationError(
                'Важность метрики должна быть в диапазоне от 0 до 200%.'
            )
        return value


class MetricValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricValue
        fields = ('id', 'value', 'created_at', 'satisfaction')
        read_only_fields = ('id', 'created_at', 'satisfaction')

    def validate_value(self, value):
        metric = self.context.get('metric')

        if metric is None:
            raise serializers.ValidationError('Метрика не определена.')

        if not metric.min_value <= value <= metric.max_value:
            raise serializers.ValidationError(
                f'Значение должно быть в диапазоне от '
                f'{metric.min_value} до {metric.max_value}.'
            )

        return value
