from django.core.management.base import BaseCommand

from apps.accounts.models import User


class Command(BaseCommand):
    help = "Create demo users for SmartSeason"

    def handle(self, *args, **options):
        admin_user, _ = User.objects.get_or_create(
            username="coordinator_demo",
            defaults={
                "email": "coordinator@smartseason.local",
                "role": User.Role.ADMIN,
                "is_staff": True,
            },
        )
        admin_user.set_password("DemoPass123!")
        admin_user.role = User.Role.ADMIN
        admin_user.is_staff = True
        admin_user.is_active = True
        admin_user.save()

        agent_user, _ = User.objects.get_or_create(
            username="agent_demo",
            defaults={
                "email": "agent@smartseason.local",
                "role": User.Role.AGENT,
            },
        )
        agent_user.set_password("DemoPass123!")
        agent_user.role = User.Role.AGENT
        agent_user.is_active = True
        agent_user.save()

        self.stdout.write(self.style.SUCCESS("Demo users created/updated."))
        self.stdout.write("Admin username/email: coordinator_demo / coordinator@smartseason.local")
        self.stdout.write("Agent username/email: agent_demo / agent@smartseason.local")
        self.stdout.write("Password for both: DemoPass123!")
