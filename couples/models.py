import secrets

from django.conf import settings
from django.db import models


class Couple(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Couple #{self.id}"


class CoupleMember(models.Model):
    couple = models.ForeignKey(
        Couple,
        on_delete=models.CASCADE,
        related_name='members'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='couple_memberships'
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['couple', 'user'],
                name='unique_couple_member'
            )
        ]

    def __str__(self):
        return f"{self.user} → {self.couple}"
class CoupleInvitation(models.Model):
    couple = models.ForeignKey(
        Couple,
        on_delete=models.CASCADE,
        related_name='invitations'
    )

    code = models.CharField(
        max_length=32,
        unique=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_invitations'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    expires_at = models.DateTimeField()

    used_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return self.code