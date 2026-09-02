from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from couples.services import get_user_couple

from .models import CoupleMetric
from .serializers import CoupleMetricSerializer


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