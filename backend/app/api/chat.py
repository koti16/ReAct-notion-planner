from fastapi import APIRouter
from pydantic import BaseModel

from app.agent.react_agent import ReActAgent

router = APIRouter(prefix="/api", tags=["Chat"])

agent = ReActAgent()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    thought: str | None = None
    action: str | None = None
    observation: dict | None = None


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    result = agent.run(request.message)

    return ChatResponse(
        answer=result["answer"],
        thought=result.get("thought"),
        action=result.get("action"),
        observation=result.get("observation"),
    )
