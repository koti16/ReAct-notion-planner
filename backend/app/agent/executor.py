print("NEW EXECUTOR LOADED")

from app.services.notion_service import create_task, get_tasks


class ToolExecutor:

    @staticmethod
    def execute(action, action_input):

        # Create a new task
        if action == "create_task":

            response = create_task(
                title=action_input.get("title", "Untitled Task"),
                status=action_input.get("status", "to-do"),
                priority=action_input.get("priority", "high")
            )

            return {
                "success": True,
                "message": "Task created successfully.",
                "task_id": response["id"]
            }

        # Get all tasks
        if action == "get_tasks":

            tasks = get_tasks()

            return {
                "success": True,
                "message": "Tasks retrieved successfully.",
                "tasks": tasks
            }

        # Unknown action
        return {
            "success": False,
            "message": f"Unknown action: {action}"
        }