import asyncio

from app.services.notion_service import create_task, get_tasks


async def main():

    # Create a test task
    create_task(
        title="Test task from AI Planner",
        status="To-do",
        priority="High"
    )

    print("Task created successfully!\n")

    # Get all tasks
    tasks = get_tasks()

    print("Tasks from Notion:")

    for task in tasks:
        print(task)


if __name__ == "__main__":
    asyncio.run(main())