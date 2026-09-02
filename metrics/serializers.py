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
        min_value = attrs['min_value']
        max_value = attrs['max_value']
        target_value = attrs['target_value']

        if min_value >= max_value:
            raise serializers.ValidationError(
                'Минимальное значение должно быть меньше максимального.'
            )

        if not min_value <= target_value <= max_value:
            raise serializers.ValidationError(
                'Оптимальное значение должно находиться внутри диапазона шкалы.'
            )

        if attrs['scale_type'] == CoupleMetric.ScaleType.BALANCE:
            if min_value != -99 or max_value != 99:
                raise serializers.ValidationError(
                    'Для шкалы «Баланс» допустим только диапазон от -99 до 99.'
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
