from rest_framework import serializers

from apps.accounts.models import User

from .models import Field, FieldUpdate


class FieldSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    assigned_agent_name = serializers.CharField(
        source="assigned_agent.get_full_name",
        read_only=True,
    )

    class Meta:
        model = Field
        fields = [
            "id",
            "name",
            "crop_type",
            "planting_date",
            "current_stage",
            "assigned_agent",
            "assigned_agent_name",
            "status",
            "last_update_at",
            "created_at",
            "updated_at",
        ]

    def validate_assigned_agent(self, value: User):
        if value.role != User.Role.AGENT:
            raise serializers.ValidationError("Assigned user must be a Field Agent.")
        return value


class FieldUpdateSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source="agent.username", read_only=True)

    class Meta:
        model = FieldUpdate
        fields = ["id", "field", "agent", "agent_name", "stage", "notes", "created_at"]
        read_only_fields = ["agent", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        field = attrs["field"]

        if user.role == User.Role.AGENT and field.assigned_agent_id != user.id:
            raise serializers.ValidationError(
                "You can only update fields assigned to you."
            )

        return attrs

    def create(self, validated_data):
        validated_data["agent"] = self.context["request"].user
        return super().create(validated_data)
