from fastapi import APIRouter
from app.services.notion_service import create_task

router = APIRouter(prefix="/notion", tags=["Notion"])


@router.post("/task")
async def add_task():
    task = create_task("Learn LangGraph")
    return {
        "message": "Task created successfully",
        "id": task["id"]
    }