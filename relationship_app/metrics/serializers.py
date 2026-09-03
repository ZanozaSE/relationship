from rest_framework import serializers

from .models import CoupleMetric, MetricImportance, MetricValue


class CoupleMetricSerializer(serializers.ModelSerializer):
    importance = serializers.SerializerMethodField()
    latest_value = serializers.SerializerMethodField()
    latest_satisfaction = serializers.SerializerMethodField()

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
            'latest_value',
            'latest_satisfaction',
        )

    def get_importance(self, obj):
        user = self.context['request'].user
        importance = obj.importance_settings.filter(user=user).first()
        return importance.importance if importance else 100

    def get_latest_value(self, obj):
        user = self.context['request'].user
        metric_value = (
            obj.values
            .filter(user=user)
            .order_by('-created_at', '-id')
            .first()
        )
        return metric_value.value if metric_value else None

    def get_latest_satisfaction(self, obj):
        user = self.context['request'].user
        metric_value = (
            obj.values
            .filter(user=user)
            .order_by('-created_at', '-id')
            .first()
        )
        return metric_value.satisfaction if metric_value else None


class CreateCoupleMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoupleMetric
        fields = (
            'name',
            'scale_type',
            'min_value',
            'max_value',
            'target_value',
            'left_label',
            'right_label',
        )

    def validate(self, attrs):
        scale_type = attrs['scale_type']
        min_value = attrs['min_value']
        max_value = attrs['max_value']
        target_value = attrs['target_value']

        if scale_type == CoupleMetric.ScaleType.BALANCE:
            if min_value != -99 or max_value != 99:
                raise serializers.ValidationError(
                    'Для шкалы «Баланс» диапазон строго от -99 до 99.'
                )
            if target_value != 0:
                raise serializers.ValidationError(
                    'Для шкалы «Баланс» оптимальное значение строго равно 0.'
                )
        elif scale_type == CoupleMetric.ScaleType.LEVEL:
            if min_value != 1 or max_value != 100:
                raise serializers.ValidationError(
                    'Для шкалы «Уровень» диапазон строго от 1 до 100.'
                )
            if target_value != 100:
                raise serializers.ValidationError(
                    'Для шкалы «Уровень» оптимальное значение строго равно 100.'
                )

        if not attrs['name'].strip():
            raise serializers.ValidationError(
                {'name': 'Название метрики не может быть пустым.'}
            )

        if not attrs['left_label'].strip() or not attrs['right_label'].strip():
            raise serializers.ValidationError(
                'Подписи обоих полюсов шкалы обязательны.'
            )

        return attrs


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
