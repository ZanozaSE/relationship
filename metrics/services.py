import math

from django.db.models import OuterRef, Subquery

from .models import CoupleMetric, MetricImportance, MetricValue


def calculate_relationship_satisfaction(user, couple):
    """
    Рассчитывает общую удовлетворённость отношениями для одного участника пары.

    Используются только активные метрики пары, по которым у пользователя есть
    последнее значение. Важность метрики берётся индивидуально для этого
    пользователя; если настройка ещё не создана, используется значение 100%.

    Формула взвешенного геометрического среднего:
        R = exp(sum(w_i * ln(S_i)) / sum(w_i))

    S_i — удовлетворённость конкретной метрикой, w_i — её важность.
    """
    latest_value_subquery = (
        MetricValue.objects
        .filter(
            metric=OuterRef('pk'),
            user=user,
        )
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

        # Нулевая удовлетворённость невозможна при текущих шкалах, но
        # оставляем защиту для будущих пользовательских диапазонов.
        if satisfaction <= 0:
            return 0.0

        weight = importance / 100
        weighted_log_sum += weight * math.log(satisfaction)
        total_weight += weight

    if total_weight == 0:
        return None

    return math.exp(weighted_log_sum / total_weight)
