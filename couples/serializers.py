from rest_framework import serializers

from .models import Couple, CoupleMember


class CoupleMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    display_name = serializers.CharField(
        source='user.display_name',
        read_only=True
    )

    class Meta:
        model = CoupleMember
        fields = (
            'username',
            'display_name',
            'joined_at',
        )


class CoupleSerializer(serializers.ModelSerializer):
    members = CoupleMemberSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Couple
        fields = (
            'id',
            'created_at',
            'members',
        )


class JoinCoupleSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=32
    )