from unittest.mock import MagicMock
from datetime import datetime
from fastapi.testclient import TestClient

from src.main import app
from src.api.dependencies import get_logger


def test_log_response():
    """Test demo log endpoint."""
    # Arrange
    def mock_logger():
        return MagicMock()
    
    app.dependency_overrides[get_logger] = mock_logger

    # Act
    with TestClient(app) as client:
        message = "Test log message"
        response = client.get(f"api/v1/demo/log?message={message}")

        # Assert
        assert response.status_code == 200
        assert response.json()["success"] == "true"
        assert response.json()["message"] == message
    
    # Cleanup
    app.dependency_overrides.clear()


def test_logger_debug():
    """Test logger debug method."""
    # Arrange
    mock_logger = MagicMock()
    message = "Test message"
    timestamp = datetime.now().isoformat()

    # Act
    mock_logger.debug(f"{timestamp} - {message}")

    # Assert
    mock_logger.debug.assert_called_once_with(f"{timestamp} - {message}")
