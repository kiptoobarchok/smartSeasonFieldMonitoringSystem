from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminCoordinator

from .models import Field, FieldUpdate
from .serializers import FieldSerializer, FieldUpdateSerializer


class FieldViewSet(viewsets.ModelViewSet):
    serializer_class = FieldSerializer
    queryset = Field.objects.select_related("assigned_agent").all()

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAdminCoordinator()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Field.objects.select_related("assigned_agent").all()
        if user.role == User.Role.ADMIN:
            return queryset
        return queryset.filter(assigned_agent=user)


class FieldUpdateViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = FieldUpdateSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = FieldUpdate.objects.select_related("field", "agent")
        if user.role == User.Role.ADMIN:
            return queryset
        return queryset.filter(field__assigned_agent=user)
