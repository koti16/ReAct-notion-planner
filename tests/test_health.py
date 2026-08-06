import asyncio

from httpx import ASGITransport, AsyncClient

from backend.app.main import app


def test_health_endpoint() -> None:
    async def run_test() -> None:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/health")
            assert response.status_code == 200
            assert response.json() == {"status": "ok"}

    asyncio.run(run_test())
