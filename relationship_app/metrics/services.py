import math
from datetime import datetime, timedelta

from django.utils import timezone

from .models import CoupleMetric, MetricValue


def get_metric_values(metric, user=None):
    """Возвращает сохранённые значения метрики, при необходимости для одного пользователя."""
    queryset = MetricValue.objects.filter(metric=metric)
    if user is not None:
        queryset = queryset.filter(user=user)
    return list(queryset.order_by('created_at', 'id'))


def get_latest_metric_value(metric, user):
    values = get_metric_values(metric, user)
    return values[-1] if values else None


def calculate_relationship_satisfaction(user, couple):
    """
    Рассчитывает общую удовлетворённость отношениями для одного участника пары.

    Используется последнее реально сохранённое значение каждой активной метрики.
    Фильтрация частых изменений выполняется на фронтенде: пока пользователь
    последовательно меняет значение, запрос на сохранение откладывается на 10
    минут и отправляется только с последним значением.

    Формула взвешенного геометрического среднего:
        R = exp(sum(w_i * ln(S_i)) / sum(w_i))

    S_i — удовлетворённость конкретной метрики, w_i — её важность.
    """
    metrics = list(
        CoupleMetric.objects
        .filter(couple=couple, is_active=True)
        .prefetch_related('importance_settings')
    )

    weighted_log_sum = 0.0
    total_weight = 0.0

    for metric in metrics:
        metric_value = get_latest_metric_value(metric, user)
        if metric_value is None:
            continue

        importance_setting = next(
            (
                setting
                for setting in metric.importance_settings.all()
                if setting.user_id == user.id
            ),
            None,
        )
        importance = importance_setting.importance if importance_setting is not None else 100

        if importance == 0:
            continue

        satisfaction = 100 - abs(metric_value.value - metric.target_value)
        if satisfaction <= 0:
            return 0.0

        weight = importance / 100
        weighted_log_sum += weight * math.log(satisfaction)
        total_weight += weight

    if total_weight == 0:
        return None

    return math.exp(weighted_log_sum / total_weight)


def _calculate_satisfaction_from_state(metrics, importance_by_metric, state):
    """Рассчитывает удовлетворённость по уже собранному состоянию метрик."""
    weighted_log_sum = 0.0
    total_weight = 0.0

    for metric in metrics:
        value = state.get(metric.id)
        if value is None:
            continue

        importance = importance_by_metric.get(metric.id, 100)
        if importance == 0:
            continue

        satisfaction = 100 - abs(value - metric.target_value)
        if satisfaction <= 0:
            return 0.0

        weight = importance / 100
        weighted_log_sum += weight * math.log(satisfaction)
        total_weight += weight

    if total_weight == 0:
        return None

    return math.exp(weighted_log_sum / total_weight)


def calculate_relationship_satisfaction_history(user, couple, days):
    """
    Возвращает дневную историю удовлетворённости за указанный период.

    Используются реально сохранённые значения метрик. Фронтенд отвечает за то,
    чтобы во время одного непрерывного редактирования отправлялось только
    последнее значение после 10 минут без новых изменений.
    """
    today = timezone.localdate()
    start_date = today - timedelta(days=days - 1)
    start_datetime = timezone.make_aware(
        datetime.combine(start_date, datetime.min.time())
    )
    end_datetime = timezone.now()

    metrics = list(
        CoupleMetric.objects
        .filter(couple=couple, is_active=True)
        .prefetch_related('importance_settings')
    )

    importance_by_metric = {
        metric.id: next(
            (
                setting.importance
                for setting in metric.importance_settings.all()
                if setting.user_id == user.id
            ),
            100,
        )
        for metric in metrics
    }

    state = {}
    values_by_date = {}

    for metric in metrics:
        values = get_metric_values(metric, user)
        previous_values = [value for value in values if value.created_at < start_datetime]
        if previous_values:
            state[metric.id] = previous_values[-1].value

        for metric_value in values:
            if start_datetime <= metric_value.created_at <= end_datetime:
                local_date = timezone.localtime(metric_value.created_at).date()
                values_by_date.setdefault(local_date, []).append(metric_value)

    points = []
    current_date = start_date
    while current_date <= today:
        for metric_value in sorted(
            values_by_date.get(current_date, []),
            key=lambda item: (item.created_at, item.id),
        ):
            state[metric_value.metric_id] = metric_value.value

        satisfaction = _calculate_satisfaction_from_state(
            metrics,
            importance_by_metric,
            state,
        )
        points.append({
            'date': current_date.isoformat(),
            'satisfaction': satisfaction,
        })
        current_date += timedelta(days=1)

    return points
