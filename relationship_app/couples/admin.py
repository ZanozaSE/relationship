from django.contrib import admin

from .models import Couple, CoupleInvitation, CoupleMember


@admin.register(Couple)
class CoupleAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'created_at',
    )


@admin.register(CoupleMember)
class CoupleMemberAdmin(admin.ModelAdmin):
    list_display = (
        'couple',
        'user',
        'joined_at',
    )


@admin.register(CoupleInvitation)
class CoupleInvitationAdmin(admin.ModelAdmin):
    list_display = (
        'code',
        'couple',
        'created_by',
        'created_at',
        'expires_at',
        'used_at',
    )