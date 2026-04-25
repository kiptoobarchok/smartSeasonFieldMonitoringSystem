from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin (Coordinator)"
        AGENT = "agent", "Field Agent"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT)

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
