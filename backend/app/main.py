from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.notion import router as notion_router
from app.api.ocr import router as ocr_router

app = FastAPI(
    title="ReAct Notion Planner API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notion_router)
app.include_router(chat_router)
app.include_router(ocr_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to ReAct Notion Planner API 🚀"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }