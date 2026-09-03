import math
from datetime import datetime, timedelta

from django.db.models import OuterRef, Subquery
from django.utils import timezone

from .models import CoupleMetric, MetricValue


METRIC_CHANGE_INTERVAL = timedelta(minutes=10)


def get_effective_metric_values(metric, user):
    """
    Возвращает только значимые изменения значения метрики.

    Если пользователь меняет значение несколько раз подряд, изменения,
    произошедшие менее чем через 10 минут после предыдущего учтённого
    изменения, считаются частью одного периода редактирования и не влияют
    на историю или расчёт удовлетворённости.
    """
    values = list(
        MetricValue.objects
        .filter(metric=metric, user=user)
        .order_by('created_at', 'id')
    )

    effective_values = []
    last_effective_at = None

    for metric_value in values:
        if (
            last_effective_at is None
            or metric_value.created_at - last_effective_at >= METRIC_CHANGE_INTERVAL
        ):
            effective_values.append(metric_value)
            last_effective_at = metric_value.created_at

    return effective_values


def get_latest_effective_metric_value(metric, user):
    values = get_effective_metric_values(metric, user)
    return values[-1] if values else None


def calculate_relationship_satisfaction(user, couple):
    """
    Рассчитывает общую удовлетворённость отношениями для одного участника пары.

    Используются только активные метрики пары, по которым у пользователя есть
    последнее учтённое значение. Изменения, сделанные менее чем через 10 минут
    после предыдущего учтённого изменения, игнорируются.

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
        metric_value = get_latest_effective_metric_value(metric, user)
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
        importance = (
            importance_setting.importance
            if importance_setting is not None
            else 100
        )

        if importance == 0:
            continue

        satisfaction = 100 - abs(
            metric_value.value - metric.target_value
        )

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

    Для каждого дня используется последнее учтённое значение каждой метрики,
    зафиксированное к этому моменту. Изменения, произошедшие менее чем через
    10 минут после предыдущего учтённого изменения, не влияют на состояние.
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
    effective_values_by_date = {}

    for metric in metrics:
        effective_values = get_effective_metric_values(metric, user)
        previous_values = [
            value for value in effective_values
            if value.created_at < start_datetime
        ]
        if previous_values:
            state[metric.id] = previous_values[-1].value

        for metric_value in effective_values:
            if start_datetime <= metric_value.created_at <= end_datetime:
                local_date = timezone.localtime(metric_value.created_at).date()
                effective_values_by_date.setdefault(local_date, []).append(metric_value)

    points = []
    current_date = start_date
    while current_date <= today:
        for metric_value in sorted(
            effective_values_by_date.get(current_date, []),
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
