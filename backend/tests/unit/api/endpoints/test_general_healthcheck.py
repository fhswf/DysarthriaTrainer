from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock

from src.main import app


def test_health_response():
    with TestClient(app) as client:
        response = client.get("api/v1/")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
