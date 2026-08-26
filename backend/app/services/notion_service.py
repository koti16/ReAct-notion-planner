from notion_client import Client
from dotenv import load_dotenv
import os

load_dotenv()

notion = Client(auth=os.getenv("NOTION_TOKEN"))

def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} is not set")
    return value


DATABASE_ID = _required_env("NOTION_DATABASE_ID")

STATUS_MAP = {
    "to do": "to-do",
    "to-do": "to-do",
    "todo": "to-do",
    "not started": "Not started",
    "in progress": "In progress",
    "completed": "Done",
    "complete": "Done",
    "done": "Done",
}

PRIORITY_MAP = {"high": "high", "medium": "MEDIUM", "low": "Low"}


def _norm_status(status: str) -> str:
    return STATUS_MAP.get((status or "").strip().lower(), "to-do")


def _norm_priority(priority: str) -> str:
    p = (priority or "").strip()
    return PRIORITY_MAP.get(p.lower(), p)

def create_task(title, status="to-do", priority="high"):
    response = getattr(notion.pages, "create")(
        parent={"data_source_id": DATABASE_ID},
        properties={
            "Task": {
                "title": [
                    {
                        "text": {
                            "content": title
                        }
                    }
                ]
            },
            "Status": {
                "status": {
                    "name": _norm_status(status)
                }
            },
            "Priority": {
                "select": {
                    "name": _norm_priority(priority)
                }
            }
        }
    )
    return response

def update_task_status(page_id: str, status: str):
    return notion.pages.update(
        page_id=page_id,
        properties={
            "Status": {
                "status": {
                    "name": _norm_status(status)
                }
            }
        }
    )

def archive_task(page_id: str):
    return notion.pages.update(
        page_id=page_id,
        archived=True
    )

class NotionService:
    def create_task(self, title: str, description: str | None = None) -> dict:
        return create_task(title=title)

    def list_tasks(self) -> list[dict]:
        response = getattr(notion.data_sources, "query")(data_source_id=DATABASE_ID)
        return _parse_tasks(response)


def _parse_tasks(response) -> list[dict]:
    tasks = []

    for page in response["results"]:
        properties = page["properties"]

        title = ""
        if properties.get("Task", {}).get("title"):
            title = properties["Task"]["title"][0]["text"]["content"]

        status = None
        if properties.get("Status", {}).get("status"):
            status = properties["Status"]["status"]["name"]

        priority = None
        if properties.get("Priority", {}).get("select"):
            priority = properties["Priority"]["select"]["name"]

        tasks.append({"id": page["id"], "title": title, "status": status, "priority": priority})

    return tasks


def get_tasks():
    response = getattr(notion.data_sources, "query")(
        data_source_id=DATABASE_ID
    )
    return _parse_tasks(response)