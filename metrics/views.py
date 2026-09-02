from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from couples.services import get_user_couple

from .models import CoupleMetric, MetricImportance
from .serializers import CoupleMetricSerializer, MetricImportanceSerializer


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
            many=True
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
