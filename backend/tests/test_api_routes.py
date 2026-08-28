from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_route():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_notion_status_route():
    response = client.get("/api/notion/status")
    assert response.status_code == 200
    payload = response.json()
    assert "connected" in payload
    assert "hasToken" in payload
    assert "hasDatabaseId" in payload


def test_stitch_execute_route():
    response = client.post(
        "/api/stitch/execute",
        json={"tool_name": "stitch_create_component", "arguments": {"prompt": "hello"}},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "status" in payload
