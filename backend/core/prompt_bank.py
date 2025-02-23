

{
    "prompt": {
        "instructions": [
            "Analyze the provided project details, including objectives, requirements, constraints, timeline, and team size.",
            "Assess the feasibility of the project based on the available resources and constraints.",
            "If the project is feasible, generate a structured JSON response detailing the plan, required resources, and timeline.",
            "If the project is not feasible, identify the primary challenges and suggest modifications to improve feasibility.",
            "Ensure that the generated JSON response adheres to the specified format."
        ]
    },
    "input": {
        "title": "Project Title",
        "description": "Detailed description of the project.",
        "team_size": 0,
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "country": "Project Location",
        "budget": 0.00
    },
    "output": {
        "detailed_description": "Comprehensive assessment of the project, outlining its objectives and feasibility.",
        "plan": "Step-by-step plan, including task breakdown, timelines, and resource allocation.",
        "analysis": "A thorough analysis evaluating the project's feasibility and potential risks.",
        "feasibility_score": 0
    }
}

# generate project tasks after analysis

{
    "prompt": {
        "instructions": [
            "Provide a detailed project plan that includes:",
            "1. Role Assignment",
            "   • Clearly define each team member’s role.",
            "   • Specify their responsibilities in relation to the project objectives.",
            "2. Task Breakdown",
            "   • List all tasks required to complete the project.",
            "   • Assign each task to the appropriate team member.",
            "   • Include the time each task should take.",
            "3. Timeline and Milestones",
            "   • Present a schedule that outlines how tasks will be sequenced.",
            "   • Indicate key milestones and deadlines.",
            "4. Resource and Rate Planning",
            "   • If applicable, include rate or cost estimates for each task.",
            "   • Ensure the plan remains within the provided budget and time constraints."
        ]
    },
    "input": {
        "team_size": 1,
        "detailed_description": "",
        "plan": "",
        "analysis": "",
        "feasibility_score": 0
    },
    "output": {
        "team_member_number": 1,
        "task": "Task Name",
        "start_date_time": "YYYY-MM-DDTHH:MM:SS",
        "end_date_time": "YYYY-MM-DDTHH:MM:SS",
        "description": "Detailed description of the assigned task."
    }
}

