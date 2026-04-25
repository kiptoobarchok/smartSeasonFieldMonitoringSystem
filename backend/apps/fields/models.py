from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Field(models.Model):
    class Stage(models.TextChoices):
        PLANTED = "Planted", "Planted"
        GROWING = "Growing", "Growing"
        READY = "Ready", "Ready"
        HARVESTED = "Harvested", "Harvested"

    class Status(models.TextChoices):
        COMPLETED = "Completed", "Completed"
        AT_RISK = "At Risk", "At Risk"
        ACTIVE = "Active", "Active"

    name = models.CharField(max_length=120)
    crop_type = models.CharField(max_length=120)
    planting_date = models.DateField()
    current_stage = models.CharField(
        max_length=20,
        choices=Stage.choices,
        default=Stage.PLANTED,
    )
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_fields",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} - {self.crop_type}"

    @property
    def last_update_at(self):
        latest_update = self.updates.order_by("-created_at").first()
        return latest_update.created_at if latest_update else self.updated_at

    @property
    def status(self) -> str:
        if self.current_stage == self.Stage.HARVESTED:
            return self.Status.COMPLETED
        if timezone.now() - self.last_update_at > timedelta(days=7):
            return self.Status.AT_RISK
        return self.Status.ACTIVE


class FieldUpdate(models.Model):
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name="updates")
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="field_updates",
    )
    stage = models.CharField(max_length=20, choices=Field.Stage.choices)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.field.name} - {self.stage}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        Field.objects.filter(pk=self.field_id).update(current_stage=self.stage)
