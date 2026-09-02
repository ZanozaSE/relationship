from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (CoupleSerializer, JoinCoupleSerializer,)
from .services import create_couple, join_couple, get_user_couple


class CreateCoupleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            couple, invitation = create_couple(
                request.user
            )
        except ValueError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                'couple': CoupleSerializer(couple).data,
                'invite_code': invitation.code,
                'expires_at': invitation.expires_at,
            },
            status=status.HTTP_201_CREATED
        )


class JoinCoupleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinCoupleSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        try:
            couple = join_couple(
                request.user,
                serializer.validated_data['code']
            )
        except ValueError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            CoupleSerializer(couple).data,
            status=status.HTTP_200_OK
        )
class MyCoupleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            CoupleSerializer(couple).data
        )