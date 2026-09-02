import secrets
from datetime import timedelta
from django.db import transaction
from metrics.models import MetricTemplate, CoupleMetric
from django.utils import timezone
from .models import Couple, CoupleInvitation, CoupleMember


def generate_invite_code():
    return secrets.token_urlsafe(8)


@transaction.atomic
def create_couple(user):
    if CoupleMember.objects.filter(user=user).exists():
        raise ValueError('Пользователь уже состоит в паре.')

    couple = Couple.objects.create()

    CoupleMember.objects.create(
        couple=couple,
        user=user,
    )

    invitation = CoupleInvitation.objects.create(
        couple=couple,
        created_by=user,
        code=generate_invite_code(),
        expires_at=timezone.now() + timedelta(days=7),
    )

    templates = MetricTemplate.objects.filter(
        is_active=True
    )

    CoupleMetric.objects.bulk_create([
        CoupleMetric(
            couple=couple,
            template=template,
            name=template.name,
            scale_type=template.scale_type,
            min_value=template.min_value,
            max_value=template.max_value,
            target_value=template.target_value,
            left_label=template.left_label,
            right_label=template.right_label,
            sort_order=template.sort_order,
            importance=100,
            created_by=user,
        )
        for template in templates
    ])

    return couple, invitation


def join_couple(user, code):
    if CoupleMember.objects.filter(user=user).exists():
        raise ValueError('Пользователь уже состоит в паре.')

    try:
        invitation = CoupleInvitation.objects.get(code=code)
    except CoupleInvitation.DoesNotExist:
        raise ValueError('Приглашение не найдено.')

    if invitation.used_at is not None:
        raise ValueError('Это приглашение уже использовано.')

    if invitation.expires_at <= timezone.now():
        raise ValueError('Срок действия приглашения истёк.')

    if invitation.created_by == user:
        raise ValueError('Нельзя присоединиться к собственной паре.')

    if invitation.couple.members.count() >= 2:
        raise ValueError('В этой паре уже два участника.')

    CoupleMember.objects.create(
        couple=invitation.couple,
        user=user,
    )

    invitation.used_at = timezone.now()
    invitation.save(update_fields=['used_at'])

    return invitation.couple


def get_user_couple(user):
    membership = (
        CoupleMember.objects
        .select_related('couple')
        .filter(user=user)
        .first()
    )

    if membership is None:
        return None

    return membership.couple
