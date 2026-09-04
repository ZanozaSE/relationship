import secrets

from django.conf import settings
from django.db import models


class Couple(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    relationship_start_date = models.DateField(null=True, blank=True)

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


class CoupleGoal(models.Model):
    couple = models.ForeignKey(
        Couple,
        on_delete=models.CASCADE,
        related_name='goals'
    )

    title = models.CharField(max_length=120)

    description = models.TextField(blank=True)

    current_value = models.PositiveIntegerField(default=0)

    target_value = models.PositiveIntegerField()

    unit = models.CharField(max_length=30, blank=True)

    deadline = models.DateField(null=True, blank=True)

    is_completed = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_couple_goals'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['is_completed', '-created_at', '-id']

    def __str__(self):
        return f"{self.title} → Couple #{self.couple_id}"

    @property
    def progress(self):
        if self.target_value <= 0:
            return 100
        return min(100, round(self.current_value / self.target_value * 100))


class CoupleNote(models.Model):
    couple = models.ForeignKey(
        Couple,
        on_delete=models.CASCADE,
        related_name='notes'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='couple_notes'
    )

    content = models.TextField()

    is_private = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at', '-id']

    def __str__(self):
        return f"Note #{self.id} → Couple #{self.couple_id}"
