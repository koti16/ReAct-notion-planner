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
                    "name": status
                }
            },
            "Priority": {
                "select": {
                    "name": priority
                }
            }
        }
    )
    return response

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

        tasks.append({"title": title, "status": status})

    return tasks


def get_tasks():
    response = getattr(notion.data_sources, "query")(
        data_source_id=DATABASE_ID
    )
    return _parse_tasks(response)