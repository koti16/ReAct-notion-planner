from backend.app.models.task import Task


class TaskService:
    def __init__(self) -> None:
        self._tasks: list[Task] = []

    def list_tasks(self) -> list[Task]:
        return self._tasks

    def create_task(self, title: str, description: str | None = None) -> Task:
        task = Task(id=str(len(self._tasks) + 1), title=title, description=description)
        self._tasks.append(task)
        return task
