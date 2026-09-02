from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from couples.services import get_user_couple

from .models import CoupleMetric, MetricImportance, MetricValue
from .serializers import (
    CoupleMetricSerializer,
    MetricImportanceSerializer,
    MetricValueSerializer,
)
from .services import calculate_relationship_satisfaction


class MyMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=404
            )

        metrics = CoupleMetric.objects.filter(
            couple=couple,
            is_active=True
        )

        serializer = CoupleMetricSerializer(
            metrics,
            many=True,
            context={'request': request},
        )

        return Response(serializer.data)


class MetricImportanceView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, metric_id):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=404
            )

        try:
            metric = CoupleMetric.objects.get(
                id=metric_id,
                couple=couple,
                is_active=True,
            )
        except CoupleMetric.DoesNotExist:
            return Response(
                {'detail': 'Метрика не найдена.'},
                status=404
            )

        importance, _ = MetricImportance.objects.get_or_create(
            metric=metric,
            user=request.user,
            defaults={'importance': 100},
        )

        serializer = MetricImportanceSerializer(
            importance,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class MetricValueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, metric_id):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=404
            )

        try:
            metric = CoupleMetric.objects.get(
                id=metric_id,
                couple=couple,
                is_active=True,
            )
        except CoupleMetric.DoesNotExist:
            return Response(
                {'detail': 'Метрика не найдена.'},
                status=404
            )

        serializer = MetricValueSerializer(
            data=request.data,
            context={'metric': metric},
        )
        serializer.is_valid(raise_exception=True)

        metric_value = serializer.save(
            metric=metric,
            user=request.user,
        )

        return Response(
            MetricValueSerializer(
                metric_value,
                context={'metric': metric},
            ).data,
            status=201,
        )


class MetricValueHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, metric_id):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=404
            )

        try:
            metric = CoupleMetric.objects.get(
                id=metric_id,
                couple=couple,
            )
        except CoupleMetric.DoesNotExist:
            return Response(
                {'detail': 'Метрика не найдена.'},
                status=404
            )

        values = MetricValue.objects.filter(
            metric=metric,
            user=request.user,
        ).order_by('-created_at', '-id')

        serializer = MetricValueSerializer(
            values,
            many=True,
            context={'metric': metric},
        )

        return Response(serializer.data)


class RelationshipSatisfactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=404
            )

        partner = (
            couple.members
            .exclude(user=request.user)
            .select_related('user')
            .first()
        )

        return Response({
            'my_satisfaction': calculate_relationship_satisfaction(
                request.user,
                couple,
            ),
            'partner_satisfaction': (
                calculate_relationship_satisfaction(partner.user, couple)
                if partner is not None
                else None
            ),
        })
