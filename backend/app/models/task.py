from dataclasses import dataclass
from typing import Optional


@dataclass
class Task:
    id: str
    title: str
    description: Optional[str] = None
    completed: bool = False
