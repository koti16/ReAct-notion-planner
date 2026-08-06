import asyncio

from httpx import ASGITransport, AsyncClient

from backend.app.main import app


def test_create_and_list_tasks() -> None:
    async def run_test() -> None:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.post(
                "/tasks",
                json={"title": "Plan sprint", "description": "Outline priorities"},
            )
            assert response.status_code == 201
            payload = response.json()
            assert payload["title"] == "Plan sprint"
            assert payload["description"] == "Outline priorities"

            list_response = await client.get("/tasks")
            assert list_response.status_code == 200
            assert any(task["id"] == payload["id"] for task in list_response.json())

    asyncio.run(run_test())
