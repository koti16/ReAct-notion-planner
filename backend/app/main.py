from fastapi import FastAPI

app = FastAPI(title="ReAct Notion Planner API")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
