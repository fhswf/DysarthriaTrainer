import pytest
from src.core.exceptions.entity_not_found import NotFoundError, UserNotFoundError


def test_not_found_error():
    """Test NotFoundError base exception."""
    error = NotFoundError("User", "12345")
    assert "User" in str(error)
    assert "12345" in str(error)
    assert error.entity_name == "User"
    assert error.identifier == "12345"


def test_user_not_found_error():
    """Test UserNotFoundError specific exception."""
    error = UserNotFoundError("12345")
    assert "User" in str(error)
    assert "12345" in str(error)
    assert error.entity_name == "User"
    assert error.identifier == "12345"
