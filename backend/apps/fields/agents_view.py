from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminCoordinator
from apps.accounts.serializers import UserSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminCoordinator])
def list_field_agents(request):
    agents = User.objects.filter(
        role=User.Role.AGENT,
        is_active=True,
    ).order_by("first_name", "last_name")
    serializer = UserSerializer(agents, many=True)
    return Response(serializer.data)
