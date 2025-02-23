from rest_framework import viewsets, permissions
from .serializers import ProjectSerializer, ProjectResponseSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Project, ProjectResponse
from .utils import analyse_project_details
from django.db.models import Count, Q
from .utils import create_project_tasks


class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint for creating, retrieving, updating, and deleting projects.
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can access
    http_method_names = ['get', 'post', 'delete']

    def perform_create(self, serializer):
        """
        Associates the created project with the logged-in user,
        then calls the analysis function.
        """
        # 1. Create and save the Project
        project = serializer.save(user=self.request.user)

        # 2. Call the analysis function (passes the ID of the newly created Project)
        analyse_project_details(project_id=project.id)


class ProjectAIEvaluationApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can access

    def get(self, request, project_id):
        """
        Fetch the AI evaluation (ProjectResponse) details for a given project.
        """
        project = get_object_or_404(Project, id=project_id)

        # Ensure the project has a response
        project_response = ProjectResponse.objects.filter(project=project).first()
        if not project_response:
            return Response(
                {"error": "No evaluation response found for this project."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProjectResponseSerializer(project_response)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectTasksAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can access

    def get(self, request, project_id):
        # Fetch the project or return 404 if not found
        project = get_object_or_404(Project, id=project_id)

        # Retrieve all tasks assigned to the project
        tasks = list(project.assignments.all().values(
            'id', 'task', 'team_member_number', 'start_date_time',
            'end_date_time', 'description', 'created_at'
        ))

        # Return only the associated tasks
        return Response(tasks, status=status.HTTP_200_OK)


class ProjectStatisticsDashboard(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can access

    def get(self, request):
        total_projects = Project.objects.count()
        projects_with_low_feasibility = ProjectResponse.objects.filter(feasibility_score__lt=5).count()
        projects_with_high_feasibility = ProjectResponse.objects.filter(feasibility_score__gt=5).count()

        data = {
            "total_projects": total_projects,
            "projects_with_low_feasibility": projects_with_low_feasibility,
            "projects_with_high_feasibility": projects_with_high_feasibility,
        }

        return Response(data, status=status.HTTP_200_OK)


class GenerateProjectTasksApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only authenticated users can access

    def post(self, request, *args, **kwargs):
        project_id = request.data.get("project_id")
        if not project_id:
            return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the project
        project = get_object_or_404(Project, id=project_id)

        # Check if the project has an associated feasibility response with a score above five
        if not hasattr(project, 'response') or project.response.feasibility_score <= 5:
            return Response({"message": "not feasible"}, status=status.HTTP_200_OK)

        # If the feasibility score is above five, return "ok"
        prompt = create_project_tasks(project.id)

        return Response({"message": "ok"}, status=status.HTTP_200_OK)
