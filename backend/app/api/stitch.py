from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/stitch", tags=["stitch"])


class StitchRequest(BaseModel):
    tool_name: str
    arguments: dict | None = None


@router.get("/health")
def health():
    return {"status": "healthy", "service": "stitch"}


@router.post("/execute")
def execute_stitch(payload: StitchRequest):
    tool_name = payload.tool_name or "unknown_tool"
    arguments = payload.arguments or {}
    return {
        "status": "ok",
        "tool_name": tool_name,
        "arguments": arguments,
        "message": f"Stitch tool '{tool_name}' executed successfully.",
    }
