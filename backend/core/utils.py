import json
import os
import re
import replicate
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import Project, ProjectResponse, AssignmentOfTask
from django.utils.dateparse import parse_datetime

# Set the API token as an environment variable
os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN


def analyse_project_details(project_id):
    """
    Analyzes a project's details using a Replicate model and stores the resulting
    analysis in the ProjectResponse model.
    """
    # 1. Retrieve the project or return 404 if not found.
    project = get_object_or_404(Project, pk=project_id)

    # 2. Build the payload with clear, professional, and detailed instructions.
    request_payload = {
        "prompt": {
            "instructions": [
                "You are an expert project analyst. Your response must be professional, well detailed, and thoroughly thought through.",
                "Review the provided project details including title, description, team size, start date, end date, country, and budget.",
                "Carefully assess the project's feasibility by evaluating its objectives, requirements, constraints, timeline, and team size.",
                "Provide a comprehensive and thoughtful analysis of the project's potential, clearly outlining any risks or challenges.",
                "If the project is feasible, produce a detailed plan that includes required resources, a clear timeline, and actionable steps.",
                "If the project is not feasible, clearly state the primary challenges and propose specific, actionable modifications to improve feasibility.",
                "Ensure that your response is structured, professional, and detailed in every aspect.",
                "Return only a valid JSON object that exactly follows this format:",
                "{\"detailed_description\": \"<Your detailed description>\", \"plan\": \"<Your step-by-step plan>\", \"analysis\": \"<Your feasibility analysis>\", \"feasibility_score\": <score between 1 and 10>}",
                "Do not include any additional text or commentary."
            ]
        },
        "input": {
            "title": project.title,
            "description": project.description,
            "team_size": project.team_size,
            "start_date": project.start_date.isoformat(),
            "end_date": project.end_date.isoformat(),
            "country": project.country,
            "budget": float(project.budget)
        },
        "output": {
            "detailed_description": "",
            "plan": "",
            "analysis": "",
            "feasibility_score": 0
        }
    }

    try:
        # 3. Use replicate.stream to call the model with our JSON-stringified prompt.
        stream = replicate.stream(
            "ibm-granite/granite-3.1-2b-instruct",
            input={"prompt": json.dumps(request_payload)}
        )
        result = ""
        for event in stream:
            result += str(event)  # Convert each event to string before concatenating

        # Debug: output the raw result for inspection.
        print("Raw output from replicate model:", result)

        # 4. Extract the JSON object using regex in case extra text is present.
        match = re.search(r'\{.*\}', result, re.DOTALL)
        json_str = match.group(0) if match else result

        # 5. Parse the JSON string.
        response_data = json.loads(json_str)

    except json.JSONDecodeError as e:
        print("JSON decode error:", e)
        print("Raw output was:", result)
        return
    except Exception as e:
        print(f"Error calling Replicate model: {e}")
        return

    # 6. Extract the analysis fields from the response.
    detailed_description = response_data.get("detailed_description", "")
    plan = response_data.get("plan", "")
    analysis = response_data.get("analysis", "")
    feasibility_score = response_data.get("feasibility_score", 0)

    # 7. Create or update the ProjectResponse in the database.
    project_response, created = ProjectResponse.objects.update_or_create(
        project=project,
        defaults={
            "detailed_description": detailed_description,
            "plan": plan,
            "analysis": analysis,
            "feasibility_score": feasibility_score,
        }
    )

    print(f"{'Created' if created else 'Updated'} ProjectResponse for Project ID {project_id}")
    return project_response

def create_project_tasks(project_id):
    """
    Analyzes a project's details to allocate tasks based on the available team members.
    The generated assignments are saved into the AssignmentOfTask model using the correct format.
    """
    # 1. Retrieve the project using its ID.
    project = get_object_or_404(Project, pk=project_id)

    # 2. Build the request payload with detailed instructions.
    request_payload = {
        "prompt": {
            "instructions": [
                "Provide a detailed project plan that includes:",
                "1. Role Assignment:",
                "   - Clearly define each team member’s role.",
                "   - Specify their responsibilities relative to the project objectives.",
                "2. Task Breakdown:",
                "   - List all tasks required to complete the project.",
                "   - Assign each task to the appropriate team member.",
                "   - Include the estimated time each task should take, using ISO datetime format (YYYY-MM-DDTHH:MM:SS).",
                "3. Timeline and Milestones:",
                "   - Present a schedule outlining how tasks will be sequenced.",
                "   - Indicate key milestones and deadlines in ISO datetime format.",
                "4. Resource and Rate Planning:",
                "   - Include rate or cost estimates for each task if applicable.",
                "   - Ensure the plan remains within the provided budget and timeline.",
                "IMPORTANT: Output the assignments strictly in a valid JSON format. The JSON must either be a single object or an array of objects, and each object must include the following keys:",
                "         'team_member_number', 'task', 'start_date_time', 'end_date_time', and 'description'.",
                "         The datetime fields must be in the format 'YYYY-MM-DDTHH:MM:SS'."
            ]
        },
        "input": {
            "team_size": project.team_size,
            "detailed_description": project.description,
            "plan": "",  # Initial value if no plan exists yet.
            "analysis": "",  # Initial value if no analysis exists yet.
            "feasibility_score": 0  # Default value.
        },
        "output": {
            "team_member_number": 1,
            "task": "Task Name",
            "start_date_time": "YYYY-MM-DDTHH:MM:SS",
            "end_date_time": "YYYY-MM-DDTHH:MM:SS",
            "description": "Detailed description of the assigned task."
        }
    }

    try:
        # 3. Call the Replicate model using replicate.stream.
        stream = replicate.stream(
            "ibm-granite/granite-3.1-2b-instruct",
            input={"prompt": json.dumps(request_payload)}
        )
        result = ""
        for event in stream:
            result += str(event)  # Convert each event to a string before concatenating.

        # Debug: output the raw result.
        print("Raw output from replicate model:", result)

        # 4. Extract the JSON output using regex to find either an object or array.
        match = re.search(r'(\{.*\}|\[.*\])', result, re.DOTALL)
        json_str = match.group(0) if match else result

        # 5. Parse the JSON string.
        response_data = json.loads(json_str)

    except json.JSONDecodeError as e:
        print("JSON decode error:", e)
        print("Raw output was:", result)
        return None
    except Exception as e:
        print(f"Error calling Replicate model: {e}")
        return None

    # 6. Normalize the response: ensure assignments is a list.
    if isinstance(response_data, list):
        assignments = response_data
    elif isinstance(response_data, dict):
        assignments = [response_data]
    else:
        print("Unexpected response format:", response_data)
        return None

    created_assignments = []

    # 7. Iterate over each assignment and create a database record in the correct format.
    for assignment in assignments:
        try:
            team_member_number = int(assignment.get("team_member_number"))
            task = assignment.get("task")
            start_date_time_str = assignment.get("start_date_time")
            end_date_time_str = assignment.get("end_date_time")
            description = assignment.get("description")

            # Convert datetime strings to datetime objects.
            start_date_time = parse_datetime(start_date_time_str)
            end_date_time = parse_datetime(end_date_time_str)
            if start_date_time is None or end_date_time is None:
                raise ValueError("Datetime fields are not in the correct ISO format (YYYY-MM-DDTHH:MM:SS).")

            # Create the task assignment in the database.
            task_assignment = AssignmentOfTask.objects.create(
                project=project,
                team_member_number=team_member_number,
                task=task,
                start_date_time=start_date_time,
                end_date_time=end_date_time,
                description=description
            )
            created_assignments.append(task_assignment)
        except Exception as e:
            print(f"Error creating task assignment from data {assignment}: {e}")
            continue

    print(f"Created {len(created_assignments)} task assignment(s) for Project ID {project_id}")
    return created_assignments
