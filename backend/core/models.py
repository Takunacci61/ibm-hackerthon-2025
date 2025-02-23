from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from django.utils.timezone import now


# Model to store project details
class Project(models.Model):
    """
    Represents a project created by a user. Each project includes basic details,
    such as title, description, team size, timeline, country, and budget.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="projects",
        help_text="The user who owns this project."
    )  # Associates each project with a user.

    title = models.CharField(
        max_length=255,
        help_text="Title of the project."
    )  # Stores the project name.

    description = models.TextField(
        help_text="Detailed description of the project."
    )  # Provides a detailed overview of the project.

    team_size = models.PositiveIntegerField(
        help_text="Total number of team members assigned to the project."
    )  # Stores the number of people involved.

    start_date = models.DateField(
        help_text="The date when the project starts."
    )  # Defines the project's start date.

    end_date = models.DateField(
        help_text="The date when the project ends."
    )  # Defines the expected project completion date.

    country = models.CharField(
        max_length=100,
        help_text="Country where the project is being executed."
    )  # Stores the project’s location.

    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Total budget allocated for the project."
    )  # Stores the financial budget.

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the project was created."
    )  # Auto-generates the timestamp upon creation.

    def __str__(self):
        return self.title


# Model for storing a project's feasibility response
class ProjectResponse(models.Model):
    """
    Represents a feasibility response for a project. Each project can only have
    one response that includes analysis, feasibility score, and optional plans.
    """

    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="response",
        help_text="The project this response belongs to."
    )  # Enforces a strict one-to-one relationship.

    detailed_description = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed description of the project response."
    )  # Optional field for an extended response.

    plan = models.TextField(
        blank=True,
        null=True,
        help_text="Plan details for the project."
    )  # Optional field for project planning.

    analysis = models.TextField(
        help_text="Detailed analysis of the project's feasibility."
    )  # Required field for project assessment.

    feasibility_score = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Feasibility score ranging from 1 (lowest) to 10 (highest)."
    )  # Restricts the score to a valid range.

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the response was recorded."
    )  # Auto-generates creation timestamp.

    def __str__(self):
        return f"Response for {self.project} - Score: {self.feasibility_score}"


# Model for task assignments within a project
class AssignmentOfTask(models.Model):
    """
    Represents a task assigned to a team member within a project.
    Each task has a name, assigned member number, start and end times,
    and a description of what needs to be done.
    """

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="assignments",
        help_text="The project this task is assigned to."
    )  # Associates the task with a project.

    team_member_number = models.PositiveIntegerField(
        help_text="The assigned team member's number."
    )  # Stores the specific member responsible for the task.

    task = models.CharField(
        max_length=255,
        help_text="Short title or name of the task."
    )  # Stores the name of the assigned task.

    start_date_time = models.DateTimeField(
        help_text="Date and time when the task starts."
    )  # Defines the starting time of the task.

    end_date_time = models.DateTimeField(
        help_text="Date and time when the task ends."
    )  # Defines the expected completion time.

    description = models.TextField(
        help_text="Detailed description of the task."
    )  # Provides a longer description of the task.

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when this task assignment was created."
    )  # Auto-generates the timestamp.

    @property
    def duration(self):
        """
        Computes the duration of the assigned task by calculating the
        difference between the start and end times.

        Returns:
            timedelta: The time difference between end_date_time and start_date_time.
            None: If either start_date_time or end_date_time is missing.
        """
        if self.start_date_time and self.end_date_time:
            return self.end_date_time - self.start_date_time
        return None

    def __str__(self):
        """
        Returns a string representation of the task assignment,
        including the task name and its calculated duration.
        """
        return f"{self.task} (Duration: {self.duration})"
