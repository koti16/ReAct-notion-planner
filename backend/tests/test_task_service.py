from backend.app.services.task_service import TaskService


def test_create_and_list_tasks() -> None:
    service = TaskService()
    task = service.create_task("Write plan", "Draft the project plan")

    assert task.title == "Write plan"
    assert task.description == "Draft the project plan"
    assert service.list_tasks()[0].id == task.id
