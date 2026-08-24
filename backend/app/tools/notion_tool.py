from app.services.notion_service import create_task, get_tasks


async def add_task(title: str, status: str = "To-do", priority: str = "High"):
    """Create a new task in the Notion planner."""

    response = create_task(
        title=title,
        status=status,
        priority=priority
    )

    return {
        "success": True,
        "message": f"Task '{title}' created successfully",
        "task_id": response["id"]
    }


async def list_tasks():
    """Get all tasks from the Notion planner."""

    tasks = get_tasks()

    return {
        "success": True,
        "tasks": tasks
    }