from fastapi import FastAPI

from app.api.notion import router as notion_router

app = FastAPI(
    title="ReAct Notion Planner API",
    version="1.0.0"
)

app.include_router(notion_router)

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