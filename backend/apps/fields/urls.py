from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FieldViewSet, FieldUpdateViewSet
from .agents_view import list_field_agents

router = DefaultRouter()
router.register("fields", FieldViewSet, basename="field")
router.register("field-updates", FieldUpdateViewSet, basename="field-update")

urlpatterns = [
    path("", include(router.urls)),
    path("agents/", list_field_agents, name="list-agents"),
]
