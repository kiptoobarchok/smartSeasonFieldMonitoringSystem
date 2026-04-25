from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.fields.models import Field, FieldUpdate


class FieldStatusPropertyTests(TestCase):
    def setUp(self):
        self.agent = User.objects.create_user(
            username="agent_one",
            password="testpass123",
            role=User.Role.AGENT,
        )

    def test_status_completed_when_stage_is_harvested(self):
        field = Field.objects.create(
            name="North Plot",
            crop_type="Maize",
            planting_date=timezone.now().date(),
            current_stage=Field.Stage.HARVESTED,
            assigned_agent=self.agent,
        )

        Field.objects.filter(pk=field.pk).update(
            updated_at=timezone.now() - timedelta(days=30)
        )
        field.refresh_from_db()

        self.assertEqual(field.status, Field.Status.COMPLETED)

    def test_status_at_risk_when_not_updated_for_more_than_7_days(self):
        field = Field.objects.create(
            name="West Plot",
            crop_type="Beans",
            planting_date=timezone.now().date(),
            current_stage=Field.Stage.GROWING,
            assigned_agent=self.agent,
        )

        stale_update = FieldUpdate.objects.create(
            field=field,
            agent=self.agent,
            stage=Field.Stage.GROWING,
            notes="Old check-in",
        )
        FieldUpdate.objects.filter(pk=stale_update.pk).update(
            created_at=timezone.now() - timedelta(days=8)
        )
        field.refresh_from_db()

        self.assertEqual(field.status, Field.Status.AT_RISK)

    def test_status_active_when_recent_update_exists(self):
        field = Field.objects.create(
            name="East Plot",
            crop_type="Wheat",
            planting_date=timezone.now().date(),
            current_stage=Field.Stage.PLANTED,
            assigned_agent=self.agent,
        )

        FieldUpdate.objects.create(
            field=field,
            agent=self.agent,
            stage=Field.Stage.GROWING,
            notes="Healthy growth observed",
        )

        field.refresh_from_db()

        self.assertEqual(field.status, Field.Status.ACTIVE)
