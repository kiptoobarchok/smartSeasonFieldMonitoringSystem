from django.contrib import admin

from .models import Field, FieldUpdate


@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "crop_type",
        "assigned_agent",
        "current_stage",
        "planting_date",
        "updated_at",
    )
    list_filter = ("current_stage", "crop_type")
    search_fields = ("name", "crop_type", "assigned_agent__username")


@admin.register(FieldUpdate)
class FieldUpdateAdmin(admin.ModelAdmin):
    list_display = ("field", "agent", "stage", "created_at")
    list_filter = ("stage",)
    search_fields = ("field__name", "agent__username")
