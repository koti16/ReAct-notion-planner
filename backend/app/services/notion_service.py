from notion_client import Client
from dotenv import load_dotenv
import os

load_dotenv()

notion = Client(auth=os.getenv("NOTION_TOKEN"))
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")


def create_task(title, status="to-do", priority="high"):
    response = notion.pages.create(
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