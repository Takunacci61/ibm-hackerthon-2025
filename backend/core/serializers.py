from rest_framework import serializers
from .models import Project, ProjectResponse

class ProjectSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')  # Only read, automatically set to the logged-in user

    class Meta:
        model = Project
        fields = '__all__'  # Includes all fields

class ProjectResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectResponse
        fields = ['id', 'project', 'detailed_description', 'plan', 'analysis', 'feasibility_score', 'created_at']
