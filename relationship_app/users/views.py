from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        users = User.objects.filter(
            email__iexact=email,
            is_active=True,
        )

        if users.count() == 1:
            user = users.first()
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{settings.FRONTEND_BASE_URL.rstrip('/')}/"
                f"reset-password/{uid}/{token}"
            )

            send_mail(
                subject='Восстановление пароля — Relationship',
                message=(
                    'Вы запросили восстановление пароля для аккаунта Relationship.\n\n'
                    f'Перейдите по ссылке, чтобы установить новый пароль:\n{reset_url}\n\n'
                    'Ссылка действительна ограниченное время и может быть использована только один раз.\n\n'
                    'Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.'
                ),
                from_email=None,
                recipient_list=[user.email],
            )

        return Response({
            'detail': 'Если аккаунт с таким email существует, инструкция отправлена.'
        })


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Ссылка для восстановления пароля недействительна.'},
                status=400,
            )

        if not default_token_generator.check_token(
            user,
            serializer.validated_data['token'],
        ):
            return Response(
                {'detail': 'Ссылка для восстановления пароля недействительна или устарела.'},
                status=400,
            )

        try:
            validate_password(
                serializer.validated_data['new_password'],
                user=user,
            )
        except Exception as error:
            return Response({'detail': error.messages}, status=400)

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response({
            'detail': 'Пароль успешно изменён. Теперь вы можете войти в аккаунт.'
        })
