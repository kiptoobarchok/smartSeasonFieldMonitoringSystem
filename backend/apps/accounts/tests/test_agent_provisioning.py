from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


class AgentProvisioningTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="coordinator_admin",
            password="AdminPass123!",
            role=User.Role.ADMIN,
            is_staff=True,
            is_active=True,
        )

    def test_admin_can_create_agent_and_agent_can_login(self):
        self.client.force_authenticate(user=self.admin)

        payload = {
            "username": "agent_created",
            "email": "agent.created@example.com",
            "first_name": "Created",
            "last_name": "Agent",
            "password": "AgentPass123!",
        }

        create_response = self.client.post(
            reverse("admin-agent-list-create"),
            payload,
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        created_agent = User.objects.get(username="agent_created")
        self.assertEqual(created_agent.role, User.Role.AGENT)
        self.assertTrue(created_agent.is_active)
        self.assertTrue(created_agent.check_password("AgentPass123!"))

        self.client.force_authenticate(user=None)

        token_response = self.client.post(
            reverse("token_obtain_pair"),
            {
                "username": "agent_created",
                "password": "AgentPass123!",
            },
            format="json",
        )

        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", token_response.data)
