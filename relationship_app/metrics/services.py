import math
from datetime import datetime, timedelta

from django.db.models import OuterRef, Subquery
from django.utils import timezone

from .models import CoupleMetric, MetricValue


def calculate_relationship_satisfaction(user, couple):
    """
    Рассчитывает общую удовлетворённость отношениями для одного участника пары.

    Используются только активные метрики пары, по которым у пользователя есть
    последнее значение. Важность метрики берётся индивидуально для этого
    пользователя; если настройка ещё не создана, используется значение 100%.

    Формула взвешенного геометрического среднего:
        R = exp(sum(w_i * ln(S_i)) / sum(w_i))

    S_i — удовлетворённость конкретной метрики, w_i — её важность.
    """
    latest_value_subquery = (
        MetricValue.objects
        .filter(metric=OuterRef('pk'), user=user)
        .order_by('-created_at', '-id')
        .values('value')[:1]
    )

    metrics = (
        CoupleMetric.objects
        .filter(couple=couple, is_active=True)
        .annotate(latest_value=Subquery(latest_value_subquery))
        .prefetch_related('importance_settings')
    )

    weighted_log_sum = 0.0
    total_weight = 0.0

    for metric in metrics:
        if metric.latest_value is None:
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
            metric.latest_value - metric.target_value
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

    Для каждого дня используется последнее значение каждой метрики,
    зафиксированное в этот день. Если в этот день новых значений не было,
    используется последнее известное значение предыдущих дней.
    """
    today = timezone.localdate()
    start_date = today - timedelta(days=days - 1)
    start_datetime = timezone.make_aware(
        datetime.combine(start_date, datetime.min.time())
    )

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
    for metric in metrics:
        previous_value = (
            MetricValue.objects
            .filter(
                metric=metric,
                user=user,
                created_at__lt=start_datetime,
            )
            .order_by('-created_at', '-id')
            .values_list('value', flat=True)
            .first()
        )
        if previous_value is not None:
            state[metric.id] = previous_value

    values = (
        MetricValue.objects
        .filter(
            metric__in=metrics,
            user=user,
            created_at__gte=start_datetime,
        )
        .order_by('created_at', 'id')
    )

    values_by_date = {}
    for metric_value in values:
        local_date = timezone.localtime(metric_value.created_at).date()
        values_by_date.setdefault(local_date, []).append(metric_value)

    points = []
    current_date = start_date
    while current_date <= today:
        for metric_value in values_by_date.get(current_date, []):
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
