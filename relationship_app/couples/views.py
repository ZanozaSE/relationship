from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CoupleGoalSerializer,
    CoupleNoteSerializer,
    CoupleSerializer,
    JoinCoupleSerializer,
)
from .services import create_couple, join_couple, get_user_couple
from .models import CoupleGoal, CoupleNote


class CreateCoupleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            couple, invitation = create_couple(request.user)
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
        serializer = JoinCoupleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            couple = join_couple(request.user, serializer.validated_data['code'])
        except ValueError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(CoupleSerializer(couple).data, status=status.HTTP_200_OK)


class MyCoupleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        couple = get_user_couple(request.user)

        if couple is None:
            return Response(
                {'detail': 'Пользователь не состоит в паре.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(CoupleSerializer(couple).data)


class CoupleGoalsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        goals = CoupleGoal.objects.filter(couple=couple)
        return Response(CoupleGoalSerializer(goals, many=True).data)

    def post(self, request):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        serializer = CoupleGoalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        goal = serializer.save(couple=couple, created_by=request.user)
        return Response(CoupleGoalSerializer(goal).data, status=201)


class CoupleGoalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, goal_id):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        try:
            goal = CoupleGoal.objects.get(id=goal_id, couple=couple)
        except CoupleGoal.DoesNotExist:
            return Response({'detail': 'Цель не найдена.'}, status=404)

        serializer = CoupleGoalSerializer(goal, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        goal = serializer.save()
        return Response(CoupleGoalSerializer(goal).data)

    def delete(self, request, goal_id):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        try:
            goal = CoupleGoal.objects.get(id=goal_id, couple=couple)
        except CoupleGoal.DoesNotExist:
            return Response({'detail': 'Цель не найдена.'}, status=404)

        goal.delete()
        return Response(status=204)


class CoupleNotesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        notes = CoupleNote.objects.filter(couple=couple)
        return Response(CoupleNoteSerializer(notes, many=True).data)

    def post(self, request):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        serializer = CoupleNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(couple=couple, author=request.user)
        return Response(CoupleNoteSerializer(note).data, status=201)


class CoupleNoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, note_id):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        try:
            note = CoupleNote.objects.get(id=note_id, couple=couple)
        except CoupleNote.DoesNotExist:
            return Response({'detail': 'Заметка не найдена.'}, status=404)

        serializer = CoupleNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        note = serializer.save()
        return Response(CoupleNoteSerializer(note).data)

    def delete(self, request, note_id):
        couple = get_user_couple(request.user)
        if couple is None:
            return Response({'detail': 'Пользователь не состоит в паре.'}, status=404)

        try:
            note = CoupleNote.objects.get(id=note_id, couple=couple)
        except CoupleNote.DoesNotExist:
            return Response({'detail': 'Заметка не найдена.'}, status=404)

        note.delete()
        return Response(status=204)
