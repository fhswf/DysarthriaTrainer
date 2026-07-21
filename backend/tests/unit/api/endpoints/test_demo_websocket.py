from fastapi.testclient import TestClient

from src.main import app


def test_websocket_connection():
    client = TestClient(app)
    with client.websocket_connect("api/v1/demo/ws_demo/simple_test_msg") as websocket:
        data = websocket.receive_json()
        assert data == {"msg": "Hello WebSocket"}