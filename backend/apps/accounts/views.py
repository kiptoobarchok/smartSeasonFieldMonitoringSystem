from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.fields.models import FieldUpdate
from apps.fields.serializers import FieldUpdateSerializer

from .models import User
from .permissions import IsAdminCoordinator
from .serializers import (
    AgentLifecycleSummarySerializer,
    AgentProvisionSerializer,
    AgentStatusSerializer,
    UserSerializer,
)


class SmartSeasonTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token

    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        password = attrs.get("password")

        if identifier and "@" in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                attrs[self.username_field] = getattr(user, self.username_field)
            except User.DoesNotExist:
                pass

        attrs["password"] = password
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class SmartSeasonTokenObtainPairView(TokenObtainPairView):
    serializer_class = SmartSeasonTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class AdminAgentListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminCoordinator]

    def get(self, request):
        agents = (
            User.objects.filter(role=User.Role.AGENT)
            .annotate(
                assigned_fields_count=Count("assigned_fields", distinct=True),
                active_fields_count=Count(
                    "assigned_fields",
                    filter=Q(assigned_fields__current_stage__in=["Planted", "Growing", "Ready"]),
                    distinct=True,
                ),
                completed_fields_count=Count(
                    "assigned_fields",
                    filter=Q(assigned_fields__current_stage="Harvested"),
                    distinct=True,
                ),
                updates_count=Count("field_updates", distinct=True),
            )
            .order_by("is_active", "first_name", "last_name", "username")
        )

        # Compute At Risk using model property for correctness.
        agent_rows = []
        for agent in agents:
            fields = list(agent.assigned_fields.all())
            at_risk_count = sum(1 for field in fields if field.status == "At Risk")
            agent.at_risk_fields_count = at_risk_count
            agent_rows.append(agent)

        serializer = AgentLifecycleSummarySerializer(agent_rows, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AgentProvisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agent = serializer.save()
        response_data = AgentLifecycleSummarySerializer(
            User.objects.filter(pk=agent.pk)
            .annotate(
                assigned_fields_count=Count("assigned_fields", distinct=True),
                active_fields_count=Count(
                    "assigned_fields",
                    filter=Q(assigned_fields__current_stage__in=["Planted", "Growing", "Ready"]),
                    distinct=True,
                ),
                completed_fields_count=Count(
                    "assigned_fields",
                    filter=Q(assigned_fields__current_stage="Harvested"),
                    distinct=True,
                ),
                updates_count=Count("field_updates", distinct=True),
            )
            .first()
        ).data
        response_data["at_risk_fields_count"] = 0
        return Response(response_data, status=status.HTTP_201_CREATED)


class AdminAgentStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminCoordinator]

    def patch(self, request, agent_id: int):
        agent = User.objects.filter(pk=agent_id, role=User.Role.AGENT).first()
        if not agent:
            return Response({"detail": "Agent not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AgentStatusSerializer(agent, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(AgentStatusSerializer(agent).data)


class AdminAgentUpdatesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminCoordinator]

    def get(self, request, agent_id: int):
        agent = User.objects.filter(pk=agent_id, role=User.Role.AGENT).first()
        if not agent:
            return Response({"detail": "Agent not found."}, status=status.HTTP_404_NOT_FOUND)

        updates = FieldUpdate.objects.select_related("field", "agent").filter(agent=agent)[:30]
        serializer = FieldUpdateSerializer(updates, many=True)
        return Response(serializer.data)
