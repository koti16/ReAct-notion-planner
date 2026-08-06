from app.services.notion_service import create_task

response = create_task(
    title="Testing Notion API",
    status="to-do",
    priority="high"
)

print(response)