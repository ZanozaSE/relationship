from django.urls import path

from .views import (
    CoupleInvitationView,
    CreateCoupleView,
    CoupleGoalDetailView,
    CoupleGoalsView,
    CoupleNoteDetailView,
    CoupleNotesView,
    JoinCoupleView,
    LeaveCoupleView,
    MyCoupleView,
)


urlpatterns = [
    path('', CreateCoupleView.as_view(), name='create-couple'),
    path('join/', JoinCoupleView.as_view(), name='join-couple'),
    path('me/', MyCoupleView.as_view(), name='my-couple'),
    path('leave/', LeaveCoupleView.as_view(), name='leave-couple'),
    path('invitation/', CoupleInvitationView.as_view(), name='couple-invitation'),
    path('goals/', CoupleGoalsView.as_view(), name='couple-goals'),
    path('goals/<int:goal_id>/', CoupleGoalDetailView.as_view(), name='couple-goal-detail'),
    path('notes/', CoupleNotesView.as_view(), name='couple-notes'),
    path('notes/<int:note_id>/', CoupleNoteDetailView.as_view(), name='couple-note-detail'),
]
