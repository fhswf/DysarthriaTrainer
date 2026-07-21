"""
Integration tests for practice session endpoints.

Tests practice session API endpoints with actual database interactions:
- POST /api/v1/practice/sessions - Create session
- GET /api/v1/practice/sessions/{id} - Get session details
- PUT /api/v1/practice/sessions/{id}/start-recording - Start recording
- PUT /api/v1/practice/sessions/{id}/complete - Complete session
- PUT /api/v1/practice/sessions/{id}/abandon - Abandon session
- PUT /api/v1/practice/sessions/{id}/attach-audio - Attach audio file
- PUT /api/v1/practice/sessions/{id}/metrics - Update metrics
- GET /api/v1/practice/sessions - List user sessions
- DELETE /api/v1/practice/sessions/{id} - Delete session
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from uuid import uuid4, UUID
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from tests.fixtures.users import test_users
from tests.fixtures.auth import regular_user_token


@pytest_asyncio.fixture
def auth_headers(regular_user_token: str) -> dict:
    """Create authentication headers from token."""
    return {"Authorization": regular_user_token}


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, test_users: dict) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client with database session and auth overrides."""
    from src.api.dependencies import get_db, get_current_user
    from src.core.entities.user import User
    
    async def override_session():
        yield db_session
    
    async def override_current_user():
        # Return the regular test user for authentication
        user_entity = test_users["user"]
        return user_entity
    
    app.dependency_overrides[get_db] = override_session
    app.dependency_overrides[get_current_user] = override_current_user
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def exercise_id(db_session: AsyncSession) -> UUID:
    """Create a test exercise and return its ID."""
    from src.infrastructure.persistence.sqla.models import ExerciseModel, ExerciseCategoryModel
    
    # Create a category first
    category = ExerciseCategoryModel(
        id=uuid4(),
        name="Test Category",
        slug="test-category",
        description="Test category",
        display_order=1,
    )
    db_session.add(category)
    
    # Create exercise
    exercise = ExerciseModel(
        id=uuid4(),
        category_id=category.id,
        code="TEST001",
        title="Test Exercise",
        difficulty_level="beginner",
        display_order=1,
        version=1,
        is_active=True,
    )
    db_session.add(exercise)
    await db_session.commit()
    return exercise.id


class TestCreatePracticeSession:
    """Tests for creating practice sessions."""

    @pytest.mark.asyncio
    async def test_create_session_success(
        self,
        client: AsyncClient,
        test_users: dict,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully create a new practice session."""
        payload = {
            "exercise_id": str(exercise_id),
            "total_items": 10,
            "metadata": {"device": "mobile", "browser": "Chrome"},
        }

        response = await client.post(
            "/api/v1/practice/sessions",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["exercise_id"] == str(exercise_id)
        assert data["total_items"] == 10
        assert data["completed_items"] == 0
        assert data["status"] == "in_progress"
        assert data["metadata"] == payload["metadata"]
        assert "id" in data
        assert "started_at" in data

    @pytest.mark.asyncio
    async def test_create_session_unauthorized(
        self,
        client: AsyncClient,
        exercise_id: UUID,
    ):
        """Should return 401 when not authenticated."""
        payload = {
            "exercise_id": str(exercise_id),
            "total_items": 5,
        }

        response = await client.post("/api/v1/practice/sessions", json=payload)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_session_invalid_total_items(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should return 422 for invalid total_items."""
        payload = {
            "exercise_id": str(exercise_id),
            "total_items": 0,  # Invalid: must be >= 1
        }

        response = await client.post(
            "/api/v1/practice/sessions",
            json=payload,
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestGetPracticeSession:
    """Tests for retrieving practice session details."""

    @pytest.mark.asyncio
    async def test_get_session_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully retrieve session details."""
        # Create session first
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]

        # Get session
        response = await client.get(
            f"/api/v1/practice/sessions/{session_id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert data["exercise_id"] == str(exercise_id)

    @pytest.mark.asyncio
    async def test_get_session_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Should return 404 for non-existent session."""
        fake_id = str(uuid4())
        response = await client.get(
            f"/api/v1/practice/sessions/{fake_id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestStartRecording:
    """Tests for starting session recording."""

    @pytest.mark.asyncio
    async def test_start_recording_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully start recording."""
        # Create session
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]

        # Start recording
        response = await client.put(
            f"/api/v1/practice/sessions/{session_id}/start-recording",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["recording_started_at"] is not None
        assert data["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_start_recording_already_recording(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should handle starting recording when already recording."""
        # Create and start recording
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]
        
        await client.put(
            f"/api/v1/practice/sessions/{session_id}/start-recording",
            json={},
            headers=auth_headers,
        )

        # Try to start again
        response = await client.put(
            f"/api/v1/practice/sessions/{session_id}/start-recording",
            json={},
            headers=auth_headers,
        )

        # Should succeed (idempotent operation)
        assert response.status_code == 200


class TestCompleteSession:
    """Tests for completing practice sessions."""

    @pytest.mark.asyncio
    async def test_complete_session_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully complete a session."""
        # Create session
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]

        # Complete session
        response = await client.put(
            f"/api/v1/practice/sessions/{session_id}/complete",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_complete_session_already_completed(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should return 400 when trying to complete an already completed session."""
        # Create and complete session
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]
        
        await client.put(
            f"/api/v1/practice/sessions/{session_id}/complete",
            json={},
            headers=auth_headers,
        )

        # Try to complete again
        response = await client.put(
            f"/api/v1/practice/sessions/{session_id}/complete",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 400


class TestAbandonSession:
    """Tests for abandoning practice sessions."""

    @pytest.mark.asyncio
    async def test_abandon_session_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully abandon a session."""
        # Create session
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]

        # Abandon session
        response = await client.put(
            f"/api/v1/practice/sessions/{session_id}/abandon",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "abandoned"
        assert data["completed_at"] is not None


class TestListUserSessions:
    """Tests for listing user's practice sessions."""

    @pytest.mark.asyncio
    async def test_list_sessions_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully list user's sessions."""
        # Create multiple sessions
        for _ in range(3):
            await client.post(
                "/api/v1/practice/sessions",
                json={"exercise_id": str(exercise_id), "total_items": 5},
                headers=auth_headers,
            )

        # List sessions
        response = await client.get(
            "/api/v1/practice/sessions",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 3
        assert len(data["items"]) >= 3

    @pytest.mark.asyncio
    async def test_list_sessions_with_status_filter(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should filter sessions by status."""
        # Create and complete one session
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]
        await client.put(
            f"/api/v1/practice/sessions/{session_id}/complete",
            json={},
            headers=auth_headers,
        )

        # List completed sessions
        response = await client.get(
            "/api/v1/practice/sessions?status_filter=completed",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert all(item["status"] == "completed" for item in data["items"])

    @pytest.mark.asyncio
    async def test_list_sessions_with_pagination(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should support pagination."""
        response = await client.get(
            "/api/v1/practice/sessions?limit=5&offset=0",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 5
        assert data["offset"] == 0
        assert len(data["items"]) <= 5


class TestDeleteSession:
    """Tests for deleting practice sessions."""

    @pytest.mark.asyncio
    async def test_delete_session_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        exercise_id: UUID,
    ):
        """Should successfully delete a session."""
        # Create session
        create_response = await client.post(
            "/api/v1/practice/sessions",
            json={"exercise_id": str(exercise_id), "total_items": 5},
            headers=auth_headers,
        )
        session_id = create_response.json()["id"]

        # Delete session
        response = await client.delete(
            f"/api/v1/practice/sessions/{session_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = await client.get(
            f"/api/v1/practice/sessions/{session_id}",
            headers=auth_headers,
        )
        assert get_response.status_code == 404
