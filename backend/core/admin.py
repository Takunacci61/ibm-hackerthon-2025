# admin.py
from django.contrib import admin
from .models import Project, ProjectResponse, AssignmentOfTask


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    Admin interface for the Project model.
    """
    list_display = ("title", "user", "start_date", "end_date", "budget", "created_at")
    search_fields = ("title", "description", "user__username", "country")
    list_filter = ("start_date", "end_date", "country")


@admin.register(ProjectResponse)
class ProjectResponseAdmin(admin.ModelAdmin):
    """
    Admin interface for the ProjectResponse model.
    """
    list_display = ("project", "feasibility_score", "created_at")
    search_fields = ("project__title", "analysis", "plan")
    list_filter = ("feasibility_score", "created_at")


@admin.register(AssignmentOfTask)
class AssignmentOfTaskAdmin(admin.ModelAdmin):
    list_display = (
        'project',
        'team_member_number',
        'task',
        'start_date_time',
        'end_date_time',
        'created_at'
    )
    search_fields = ('project__title', 'task', 'description')
    list_filter = ('project', 'start_date_time')
