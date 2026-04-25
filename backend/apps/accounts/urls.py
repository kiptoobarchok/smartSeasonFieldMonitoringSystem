from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminAgentListCreateView,
    AdminAgentStatusView,
    AdminAgentUpdatesView,
    MeView,
    SmartSeasonTokenObtainPairView,
)

urlpatterns = [
    path("auth/token/", SmartSeasonTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("admin/agents/", AdminAgentListCreateView.as_view(), name="admin-agent-list-create"),
    path("admin/agents/<int:agent_id>/status/", AdminAgentStatusView.as_view(), name="admin-agent-status"),
    path("admin/agents/<int:agent_id>/updates/", AdminAgentUpdatesView.as_view(), name="admin-agent-updates"),
]
