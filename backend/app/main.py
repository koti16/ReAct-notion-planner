import os
from typing import Any, Dict, List
from io import BytesIO

import pytesseract
from PIL import Image

# Tell pytesseract exactly where Tesseract is installed
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .api.stitch import router as stitch_router
from .services.gemini_service import generate_answer
from .services.notion_service import create_task, delete_task, list_tasks, update_task, verify_connection

app = FastAPI(
    title="ReAct Notion Planner API",
    description="Backend API for the AI-powered planning assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stitch_router)


class PlanRequest(BaseModel):
    prompt: str
    model: str | None = None


class TaskRequest(BaseModel):
    title: str | None = None
    page_id: str | None = None
    status: str | None = None
    priority: str | None = None
    date: str | None = None


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "ReAct Notion Planner backend is running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/notion/status")
def notion_status():
    return verify_connection()


@app.get("/api/notion/tasks")
def notion_tasks():
    return {"tasks": list_tasks()}


@app.post("/api/notion/task")
def create_notion_task(payload: TaskRequest):
    title = (payload.title or "Untitled task").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Task title is required.")

    result = create_task(title, payload.status or "To do", payload.priority or "Medium")
    return {"ok": True, "task": result, "id": result.get("id")}


@app.put("/api/notion/task")
def update_notion_task(payload: TaskRequest):
    if not payload.page_id:
        raise HTTPException(status_code=400, detail="page_id is required.")

    result = update_task(payload.page_id, payload.status, payload.priority)
    return result


@app.delete("/api/notion/task")
def delete_notion_task(payload: TaskRequest):
    if not payload.page_id:
        raise HTTPException(status_code=400, detail="page_id is required.")

    return delete_task(payload.page_id)


@app.post("/api/plan")
def plan_task(request: PlanRequest):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required.")

    try:
        answer = generate_answer(f"Turn this into a concise planning response: {prompt}", request.model)
    except Exception:
        answer = f"I planned this request: {prompt}"

    created_task = {
        "title": prompt[:60] or "New task",
        "priority": "High",
        "status": "To do",
        "date": "Today",
        "project": "General",
    }
    return {
        "result": answer,
        "answer": answer,
        "createdTask": created_task,
    }


@app.post("/api/chat")
def chat(request: PlanRequest):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required.")

    try:
        answer = generate_answer(prompt, request.model)
    except Exception:
        answer = f"Assistant reply: {prompt}"

    return {
        "answer": answer,
        "createdTask": None,
        "status": "ok",
    }

@app.post("/api/ocr")
async def ocr(file: UploadFile = File(...)):
    filename = file.filename or "upload"

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    try:
        content = await file.read()

        image = Image.open(BytesIO(content))

        # Convert to RGB for reliable OCR
        image = image.convert("RGB")

        text = pytesseract.image_to_string(image).strip()

        if not text:
            return {
                "ok": True,
                "text": "",
                "filename": filename,
                "message": "No readable text was found in the image."
            }

        return {
            "ok": True,
            "text": text,
            "filename": filename,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(exc)}"
        )
