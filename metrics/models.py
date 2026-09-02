from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class MetricTemplate(models.Model):
    class ScaleType(models.TextChoices):
        BALANCE = 'balance', 'Баланс'
        LEVEL = 'level', 'Уровень'

    name = models.CharField(
        max_length=100
    )

    scale_type = models.CharField(
        max_length=20,
        choices=ScaleType.choices
    )

    min_value = models.IntegerField()

    max_value = models.IntegerField()

    target_value = models.IntegerField()

    left_label = models.CharField(
        max_length=50
    )

    right_label = models.CharField(
        max_length=50
    )

    sort_order = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.name


class CoupleMetric(models.Model):
    class ScaleType(models.TextChoices):
        BALANCE = 'balance', 'Баланс'
        LEVEL = 'level', 'Уровень'

    couple = models.ForeignKey(
        'couples.Couple',
        on_delete=models.CASCADE,
        related_name='metrics'
    )

    template = models.ForeignKey(
        MetricTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='couple_metrics'
    )

    name = models.CharField(
        max_length=100
    )

    scale_type = models.CharField(
        max_length=20,
        choices=ScaleType.choices
    )

    min_value = models.IntegerField()

    max_value = models.IntegerField()

    target_value = models.IntegerField()

    left_label = models.CharField(
        max_length=50
    )

    right_label = models.CharField(
        max_length=50
    )

    sort_order = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )

    importance = models.PositiveSmallIntegerField(
        default=100,
        validators=[
            MinValueValidator(70),
            MaxValueValidator(130),
        ],
        help_text='Вес метрики в процентах. Допустимый диапазон: 70–130%.',
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_metrics'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"{self.name} → Couple #{self.couple_id}"


class MetricValue(models.Model):
    metric = models.ForeignKey(
        CoupleMetric,
        on_delete=models.CASCADE,
        related_name='values'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='metric_values'
    )

    value = models.IntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} → {self.metric}: {self.value}"

    @property
    def satisfaction(self):
        return 100 - abs(self.value - self.metric.target_value)
