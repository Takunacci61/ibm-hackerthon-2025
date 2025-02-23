from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectTasksAPIView, ProjectStatisticsDashboard, ProjectAIEvaluationApiView, GenerateProjectTasksApiView

# Create a router for automatic URL mapping
router = DefaultRouter()
router.register('projects', ProjectViewSet)

urlpatterns = [
    path('api/', include(router.urls)),  # This will create /api/projects/ endpoints
    path('api/project/<int:project_id>/tasks/', ProjectTasksAPIView.as_view(), name='get_project_tasks'),
    path('projects/statistics/', ProjectStatisticsDashboard.as_view(), name='project-statistics'),
    path('projects/<int:project_id>/ai-evaluation/', ProjectAIEvaluationApiView.as_view(), name='project-ai-evaluation'),
    path('api/projects/tasks/generate/', GenerateProjectTasksApiView.as_view(), name='generate-project-tasks'),
]
