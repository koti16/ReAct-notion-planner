"""Notion-specific tool wrapper for backend operations."""

from backend.app.services.notion_service import NotionService


class NotionTool:
    def __init__(self, service: NotionService | None = None) -> None:
        self.service = service or NotionService()

    def create_task(self, title: str, description: str | None = None) -> dict[str, object]:
        return self.service.create_task(title, description)

    def list_tasks(self) -> list[dict[str, object]]:
        return self.service.list_tasks()
