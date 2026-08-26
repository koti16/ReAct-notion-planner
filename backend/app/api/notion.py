from fastapi import APIRouter
from pydantic import BaseModel

from app.services.notion_service import create_task, update_task_status, archive_task, get_tasks

router = APIRouter(prefix="/notion", tags=["Notion"])


class TaskCreate(BaseModel):
    title: str
    status: str = "to-do"
    priority: str = "high"


class TaskUpdate(BaseModel):
    page_id: str
    status: str


class TaskDelete(BaseModel):
    page_id: str


@router.get("/tasks")
async def list_tasks():
    return {"tasks": get_tasks()}


@router.post("/task")
async def add_task(payload: TaskCreate):
    task = create_task(title=payload.title, status=payload.status, priority=payload.priority)
    return {
        "message": "Task created successfully",
        "id": task["id"]
    }


@router.put("/task")
async def update_task(payload: TaskUpdate):
    update_task_status(page_id=payload.page_id, status=payload.status)
    return {"message": "Task updated successfully"}


@router.delete("/task")
async def delete_task(payload: TaskDelete):
    archive_task(page_id=payload.page_id)
    return {"message": "Task archived successfully"}