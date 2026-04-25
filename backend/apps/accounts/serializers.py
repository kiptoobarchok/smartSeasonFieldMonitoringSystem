from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]


class AgentProvisionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "is_active",
        ]
        read_only_fields = ["id", "is_active"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data, role=User.Role.AGENT, is_active=True)
        user.set_password(password)
        user.save()
        return user


class AgentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "is_active"]


class AgentLifecycleSummarySerializer(serializers.ModelSerializer):
    assigned_fields_count = serializers.IntegerField(read_only=True)
    active_fields_count = serializers.IntegerField(read_only=True)
    at_risk_fields_count = serializers.IntegerField(read_only=True)
    completed_fields_count = serializers.IntegerField(read_only=True)
    updates_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "assigned_fields_count",
            "active_fields_count",
            "at_risk_fields_count",
            "completed_fields_count",
            "updates_count",
        ]
