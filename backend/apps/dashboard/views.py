from collections import Counter

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.fields.models import Field, FieldUpdate
from apps.fields.serializers import FieldSerializer, FieldUpdateSerializer


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == User.Role.ADMIN:
            fields = list(Field.objects.select_related("assigned_agent").all())
            updates = FieldUpdate.objects.select_related("field", "agent").all()[:10]
        else:
            fields = list(
                Field.objects.select_related("assigned_agent").filter(assigned_agent=user)
            )
            updates = (
                FieldUpdate.objects.select_related("field", "agent")
                .filter(field__assigned_agent=user)
                .all()[:10]
            )

        status_counts = Counter(field.status for field in fields)

        payload = {
            "total_fields": len(fields),
            "status_breakdown": {
                "Completed": status_counts.get("Completed", 0),
                "At Risk": status_counts.get("At Risk", 0),
                "Active": status_counts.get("Active", 0),
            },
            "fields": FieldSerializer(fields, many=True).data,
            "recent_updates": FieldUpdateSerializer(updates, many=True).data,
        }

        return Response(payload)
