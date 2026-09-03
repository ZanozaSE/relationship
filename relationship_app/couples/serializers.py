from rest_framework import serializers

from .models import Couple, CoupleGoal, CoupleMember, CoupleNote


class CoupleMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    display_name = serializers.CharField(
        source='user.display_name',
        read_only=True
    )

    avatar_url = serializers.URLField(
        source='user.avatar_url',
        read_only=True,
    )

    class Meta:
        model = CoupleMember
        fields = (
            'username',
            'display_name',
            'avatar_url',
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
            'together_days',
            'members',
        )


class CoupleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Couple
        fields = ('together_days',)

    def validate_together_days(self, value):
        if value < 0:
            raise serializers.ValidationError('Количество дней не может быть отрицательным.')
        return value


class JoinCoupleSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=32
    )


class CoupleGoalSerializer(serializers.ModelSerializer):
    progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = CoupleGoal
        fields = (
            'id',
            'title',
            'description',
            'current_value',
            'target_value',
            'unit',
            'deadline',
            'progress',
            'is_completed',
            'created_by',
            'created_at',
        )
        read_only_fields = (
            'id',
            'progress',
            'is_completed',
            'created_by',
            'created_at',
        )

    def validate(self, attrs):
        target_value = attrs.get('target_value', getattr(self.instance, 'target_value', None))
        current_value = attrs.get('current_value', getattr(self.instance, 'current_value', 0))

        if target_value is not None and target_value <= 0:
            raise serializers.ValidationError({
                'target_value': 'Целевое значение должно быть больше нуля.'
            })

        if current_value < 0:
            raise serializers.ValidationError({
                'current_value': 'Текущее значение не может быть отрицательным.'
            })

        return attrs

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.is_completed = instance.current_value >= instance.target_value
        instance.save()
        return instance


class CoupleNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoupleNote
        fields = (
            'id',
            'content',
            'author',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'author',
            'created_at',
            'updated_at',
        )

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError('Заметка не может быть пустой.')
        return value
