"""
Integration tests for library item endpoints.

Tests the complete HTTP request/response cycle for library item operations:
- Creating standalone library items
- Listing and filtering library items
- Retrieving individual library items
- Updating library items
- Deleting library items
- Duplicating items (as library or exercise items)
- Attaching library items to exercises
- Creating exercises from library items
- RBAC enforcement
"""

import pytest
from uuid import uuid4
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from tests.fixtures.auth import admin_token, therapist_token, regular_user_token
from tests.fixtures.users import test_users
from tests.fixtures.roles import base_roles


pytestmark = pytest.mark.asyncio


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
async def client(db_session: AsyncSession, test_users: dict):
    """Create async test client with database session and auth overrides."""
    from src.api.dependencies import get_db, get_current_user
    
    current_test_user = None
    
    async def override_session():
        yield db_session
    
    async def override_current_user():
        if current_test_user:
            return current_test_user
        return test_users["admin"]
    
    app.dependency_overrides[get_db().session] = override_session
    app.dependency_overrides[get_current_user] = override_current_user
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            def set_current_user(user_key: str):
                nonlocal current_test_user
                current_test_user = test_users.get(user_key)
            ac.set_current_user = set_current_user
            yield ac
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
async def sample_category(db_session: AsyncSession):
    """Create a sample exercise category."""
    from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
    
    category = ExerciseCategoryModel(
        name="Lip Exercises",
        slug="lip-exercises",
        display_order=1,
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def sample_exercise(db_session: AsyncSession, sample_category):
    """Create a sample exercise."""
    from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
    
    exercise = ExerciseModel(
        category_id=sample_category.id,
        code="EX-001",
        title="Basic Lip Training",
        difficulty_level="beginner",
        display_order=1,
        version=1,
        is_active=True,
        created_by="admin",
    )
    db_session.add(exercise)
    await db_session.commit()
    await db_session.refresh(exercise)
    return exercise


@pytest.fixture
async def library_item(db_session: AsyncSession):
    """Create a sample library item with content."""
    from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
    from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
    from datetime import datetime, timezone
    
    # Create library item
    item = ExerciseItemModel(
        exercise_id=None,  # Library item has no exercise
        is_library_item=True,
        item_type="movement",
        display_order=0,
        repetitions=3,
        duration_seconds=5,
        item_metadata={"difficulty": "medium"},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(item)
    await db_session.flush()
    
    # Add content
    content = ExerciseItemContentModel(
        item_id=item.id,
        language="de",
        text_content="Öffnen Sie den Mund weit",
        demonstration_video_url="https://example.com/video.mp4",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(content)
    await db_session.commit()
    await db_session.refresh(item)
    
    return item


@pytest.fixture
async def exercise_item(db_session: AsyncSession, sample_exercise):
    """Create a regular exercise item (not library)."""
    from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
    from datetime import datetime, timezone
    
    item = ExerciseItemModel(
        exercise_id=sample_exercise.id,
        is_library_item=False,
        item_type="speech_practice",
        display_order=1,
        repetitions=5,
        item_metadata={"text": "Say 'ah'"},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item


# ============================================================================
# POST /api/v1/exercise/items/library - Create Library Item
# ============================================================================

class TestCreateLibraryItem:
    """Test library item creation endpoint."""
    
    async def test_create_library_item_as_admin_success(self, client: AsyncClient, admin_token: str):
        """Admin can create a library item."""
        request_data = {
            "item_type": "movement",
            "repetitions": 3,
            "duration_seconds": 10,
            "metadata": {"difficulty": "easy", "tags": ["opening"]},
            "contents": [
                {
                    "language": "de",
                    "text_content": "Öffnen Sie den Mund weit",
                    "demonstration_video_url": "https://example.com/video_de.mp4",
                },
                {
                    "language": "en",
                    "text_content": "Open your mouth wide",
                    "demonstration_video_url": "https://example.com/video_en.mp4",
                }
            ],
        }
        print(f"Request data: {request_data}")
        
        response = await client.post(
            "/api/v1/exercise/items/library",
            json=request_data,
            headers={"Authorization": admin_token},
        )
        
        if response.status_code != 201:
            print(f"Error response: {response.status_code}")
            print(f"Error detail: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["item_type"] == "movement"
        assert data["is_library_item"] is True
        assert data["exercise_id"] is None
        assert data["repetitions"] == 3
        assert len(data["contents"]) == 2
        assert "id" in data
    
    async def test_create_library_item_as_therapist_success(self, client: AsyncClient, therapist_token: str):
        """Therapist can create a library item."""
        client.set_current_user("therapist")
        response = await client.post(
            "/api/v1/exercise/items/library",
            json={
                "item_type": "speech_practice",
                "contents": [
                    {
                        "language": "de",
                        "title": "Vokal Übung",
                        "description": "Sagen Sie 'Ah'",
                        "text_content": "Ahhhhh",
                    }
                ],
            },
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_library_item"] is True
    
    async def test_create_library_item_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str):
        """Regular user cannot create library items."""
        client.set_current_user("user")
        response = await client.post(
            "/api/v1/exercise/items/library",
            json={
                "item_type": "information",
                "contents": [{"language": "de", "text_content": "Test information"}],
            },
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_create_library_item_without_contents_fails(self, client: AsyncClient, admin_token: str):
        """Creating library item without contents fails validation."""
        response = await client.post(
            "/api/v1/exercise/items/library",
            json={
                "item_type": "movement",
                "contents": [],  # Empty contents not allowed
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 422  # Validation error
    
    async def test_create_library_item_invalid_type(self, client: AsyncClient, admin_token: str):
        """Invalid item type fails validation."""
        response = await client.post(
            "/api/v1/exercise/items/library",
            json={
                "item_type": "invalid_type",
                "contents": [{"language": "de", "text_content": "Test content"}],
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 422


# ============================================================================
# GET /api/v1/exercise/items/library - List Library Items
# ============================================================================

class TestListLibraryItems:
    """Test library items listing endpoint."""
    
    async def test_list_library_items_success(self, client: AsyncClient, library_item):
        """Can list library items."""
        response = await client.get("/api/v1/exercise/items/library")
        
        if response.status_code != 200:
            print(f"Response body: {response.text}")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert len(data["items"]) > 0
        assert data["total"] > 0
    
    async def test_list_library_items_with_type_filter(self, client: AsyncClient, library_item):
        """Can filter library items by type."""
        response = await client.get(
            "/api/v1/exercise/items/library",
            params={"item_type": "movement"}
        )
        
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["item_type"] == "movement"
    
    async def test_list_library_items_with_language_filter(self, client: AsyncClient, library_item):
        """Can filter library items by language."""
        response = await client.get(
            "/api/v1/exercise/items/library",
            params={"language": "de"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    async def test_list_library_items_with_pagination(self, client: AsyncClient, library_item):
        """Pagination parameters work correctly."""
        response = await client.get(
            "/api/v1/exercise/items/library",
            params={"limit": 10, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10
        assert data["offset"] == 0
    
    async def test_list_library_items_only_returns_library_items(self, client: AsyncClient, library_item, exercise_item):
        """List only returns items with is_library_item=True."""
        response = await client.get("/api/v1/exercise/items/library")
        
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["is_library_item"] is True
            assert item["exercise_id"] is None


# ============================================================================
# GET /api/v1/exercise/items/library/{item_id} - Get Library Item
# ============================================================================

class TestGetLibraryItem:
    """Test get single library item endpoint."""
    
    async def test_get_library_item_success(self, client: AsyncClient, library_item):
        """Can retrieve a library item by ID."""
        response = await client.get(f"/api/v1/exercise/items/library/{library_item.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(library_item.id)
        assert data["is_library_item"] is True
        assert data["exercise_id"] is None
        assert "contents" in data
    
    async def test_get_library_item_with_language_filter(self, client: AsyncClient, library_item):
        """Can filter content by language."""
        response = await client.get(
            f"/api/v1/exercise/items/library/{library_item.id}",
            params={"language": "de"}
        )
        
        assert response.status_code == 200
        data = response.json()
        for content in data["contents"]:
            assert content["language"] == "de"
    
    async def test_get_library_item_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent library item."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/exercise/items/library/{fake_id}")
        
        assert response.status_code == 404
    
    async def test_get_exercise_item_as_library_item_fails(self, client: AsyncClient, exercise_item):
        """Cannot retrieve exercise item via library endpoint."""
        response = await client.get(f"/api/v1/exercise/items/library/{exercise_item.id}")
        
        assert response.status_code == 404


# ============================================================================
# PATCH /api/v1/exercise/items/library/{item_id} - Update Library Item
# ============================================================================

class TestUpdateLibraryItem:
    """Test library item update endpoint."""
    
    async def test_update_library_item_as_admin_success(self, client: AsyncClient, admin_token: str, library_item):
        """Admin can update library item."""
        response = await client.patch(
            f"/api/v1/exercise/items/library/{library_item.id}",
            json={
                "repetitions": 10,
                "duration_seconds": 15,
                "metadata": {"difficulty": "hard", "updated": True},
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["repetitions"] == 10
        assert data["duration_seconds"] == 15
        assert data["metadata"]["difficulty"] == "hard"
    
    async def test_update_library_item_as_therapist_success(self, client: AsyncClient, therapist_token: str, library_item):
        """Therapist can update library item."""
        response = await client.patch(
            f"/api/v1/exercise/items/library/{library_item.id}",
            json={"item_type": "speech_practice"},
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["item_type"] == "speech_practice"
    
    async def test_update_library_item_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, library_item):
        """Regular user cannot update library item."""
        client.set_current_user("user")
        response = await client.patch(
            f"/api/v1/exercise/items/library/{library_item.id}",
            json={"repetitions": 999},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_update_library_item_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent library item."""
        fake_id = uuid4()
        response = await client.patch(
            f"/api/v1/exercise/items/library/{fake_id}",
            json={"repetitions": 5},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404


# ============================================================================
# DELETE /api/v1/exercise/items/library/{item_id} - Delete Library Item
# ============================================================================

class TestDeleteLibraryItem:
    """Test library item deletion endpoint."""
    
    async def test_delete_library_item_as_admin_success(self, client: AsyncClient, admin_token: str, library_item):
        """Admin can delete library item."""
        response = await client.delete(
            f"/api/v1/exercise/items/library/{library_item.id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify item is deleted
        verify_response = await client.get(f"/api/v1/exercise/items/library/{library_item.id}")
        assert verify_response.status_code == 404
    
    async def test_delete_library_item_as_therapist_forbidden(self, client: AsyncClient, therapist_token: str, library_item):
        """Therapist cannot delete library item (Admin only)."""
        client.set_current_user("therapist")
        response = await client.delete(
            f"/api/v1/exercise/items/library/{library_item.id}",
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 403
    
    async def test_delete_library_item_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent library item."""
        fake_id = uuid4()
        response = await client.delete(
            f"/api/v1/exercise/items/library/{fake_id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404


# ============================================================================
# POST /api/v1/exercise/items/{item_id}/duplicate - Duplicate Item
# ============================================================================

class TestDuplicateItem:
    """Test item duplication endpoint."""
    
    async def test_duplicate_item_as_library_item(self, client: AsyncClient, admin_token: str, library_item):
        """Can duplicate library item as another library item."""
        response = await client.post(
            f"/api/v1/exercise/items/{library_item.id}/duplicate",
            json={"as_library_item": True},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_library_item"] is True
        assert data["exercise_id"] is None
        assert data["id"] != str(library_item.id)  # Different ID
        assert data["item_type"] == library_item.item_type
    
    async def test_duplicate_item_as_exercise_item(self, client: AsyncClient, admin_token: str, library_item, sample_exercise):
        """Can duplicate library item as exercise item."""
        response = await client.post(
            f"/api/v1/exercise/items/{library_item.id}/duplicate",
            json={
                "as_library_item": False,
                "exercise_id": str(sample_exercise.id),
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_library_item"] is False
        assert data["exercise_id"] == str(sample_exercise.id)
        assert data["id"] != str(library_item.id)
    
    async def test_duplicate_exercise_item_as_library_item(self, client: AsyncClient, admin_token: str, exercise_item):
        """Can duplicate exercise item as library item."""
        response = await client.post(
            f"/api/v1/exercise/items/{exercise_item.id}/duplicate",
            json={"as_library_item": True},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_library_item"] is True
        assert data["exercise_id"] is None
    
    async def test_duplicate_item_without_exercise_id_fails(self, client: AsyncClient, admin_token: str, library_item):
        """Duplicating as exercise item without exercise_id fails."""
        response = await client.post(
            f"/api/v1/exercise/items/{library_item.id}/duplicate",
            json={"as_library_item": False},  # Missing exercise_id
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 422  # Validation error
    
    async def test_duplicate_item_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent item."""
        fake_id = uuid4()
        response = await client.post(
            f"/api/v1/exercise/items/{fake_id}/duplicate",
            json={"as_library_item": True},
            headers={"Authorization": admin_token},
        )
        
        if response.status_code != 404:
            print(f"Response: {response.status_code}, Body: {response.text}")
        assert response.status_code == 404


# ============================================================================
# POST /api/v1/exercise/items/library/{library_item_id}/attach - Attach to Exercise
# ============================================================================

class TestAttachLibraryItem:
    """Test attaching library item to exercise."""
    
    async def test_attach_library_item_to_exercise(self, client: AsyncClient, admin_token: str, library_item, sample_exercise):
        """Can attach library item to exercise."""
        response = await client.post(
            f"/api/v1/exercise/items/library/{library_item.id}/attach",
            json={
                "exercise_id": str(sample_exercise.id),
                "display_order": 5,
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_library_item"] is False  # Becomes exercise item
        assert data["exercise_id"] == str(sample_exercise.id)
        assert data["display_order"] == 5
        assert data["id"] != str(library_item.id)  # New item created
    
    async def test_attach_library_item_without_display_order(self, client: AsyncClient, admin_token: str, library_item, sample_exercise):
        """Can attach without explicit display_order (uses last)."""
        response = await client.post(
            f"/api/v1/exercise/items/library/{library_item.id}/attach",
            json={"exercise_id": str(sample_exercise.id)},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["exercise_id"] == str(sample_exercise.id)
        assert "display_order" in data
    
    async def test_attach_library_item_as_therapist(self, client: AsyncClient, therapist_token: str, library_item, sample_exercise):
        """Therapist can attach library item."""
        client.set_current_user("therapist")
        response = await client.post(
            f"/api/v1/exercise/items/library/{library_item.id}/attach",
            json={"exercise_id": str(sample_exercise.id)},
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
    
    async def test_attach_library_item_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, library_item, sample_exercise):
        """Regular user cannot attach library item."""
        client.set_current_user("user")
        response = await client.post(
            f"/api/v1/exercise/items/library/{library_item.id}/attach",
            json={"exercise_id": str(sample_exercise.id)},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_attach_library_item_not_found(self, client: AsyncClient, admin_token: str, sample_exercise):
        """Returns 404 for non-existent library item."""
        fake_id = uuid4()
        response = await client.post(
            f"/api/v1/exercise/items/library/{fake_id}/attach",
            json={"exercise_id": str(sample_exercise.id)},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_attach_to_nonexistent_exercise(self, client: AsyncClient, admin_token: str, library_item):
        """Returns 404 for non-existent exercise."""
        fake_exercise_id = uuid4()
        response = await client.post(
            f"/api/v1/exercise/items/library/{library_item.id}/attach",
            json={"exercise_id": str(fake_exercise_id)},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404


# ============================================================================
# POST /api/v1/exercise/exercises/from-items - Create Exercise from Library Items
# ============================================================================

class TestCreateExerciseFromItems:
    """Test creating exercise from library items."""
    
    async def test_create_exercise_from_library_items(self, client: AsyncClient, admin_token: str, library_item, sample_category):
        """Can create exercise from library items."""
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-LIB-001",
                "name": "Composed Exercise",
                "category_id": str(sample_category.id),
                "description": "Exercise built from library items",
                "difficulty": "medium",
                "library_item_ids": [str(library_item.id)],
            },
            headers={"Authorization": admin_token},
        )
        
        if response.status_code != 201:
            print(f"Status: {response.status_code}, Body: {response.text}")
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "EX-LIB-001"
        assert data["title"] == "Composed Exercise"
        assert "items" in data
        assert len(data["items"]) > 0
    
    async def test_create_exercise_from_multiple_library_items(self, client: AsyncClient, admin_token: str, library_item, sample_category, db_session):
        """Can create exercise from multiple library items."""
        # Create another library item
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        from datetime import datetime, timezone
        
        item2 = ExerciseItemModel(
            exercise_id=None,
            is_library_item=True,
            item_type="speech_practice",
            display_order=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(item2)
        await db_session.flush()
        
        content2 = ExerciseItemContentModel(
            item_id=item2.id,
            language="de",
            text_content="Sagen Sie 'Ah'",
            phonetic_transcription="/a:/",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(content2)
        await db_session.commit()
        
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-MULTI-001",
                "name": "Multi-Item Exercise",
                "category_id": str(sample_category.id),
                "difficulty": "easy",
                "library_item_ids": [str(library_item.id), str(item2.id)],
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 2
    
    async def test_create_exercise_from_items_as_therapist(self, client: AsyncClient, therapist_token: str, library_item, sample_category):
        """Therapist can create exercise from library items."""
        client.set_current_user("therapist")
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-THER-001",
                "name": "Therapist Exercise",
                "category_id": str(sample_category.id),
                "library_item_ids": [str(library_item.id)],
            },
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
    
    async def test_create_exercise_from_items_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, library_item, sample_category):
        """Regular user cannot create exercise from library items."""
        client.set_current_user("user")
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-USER-001",
                "name": "User Exercise",
                "category_id": str(sample_category.id),
                "library_item_ids": [str(library_item.id)],
            },
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_create_exercise_from_items_empty_list_fails(self, client: AsyncClient, admin_token: str, sample_category):
        """Cannot create exercise with empty library_item_ids."""
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-EMPTY-001",
                "name": "Empty Exercise",
                "category_id": str(sample_category.id),
                "library_item_ids": [],  # Empty not allowed
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 422
    
    async def test_create_exercise_from_items_category_not_found(self, client: AsyncClient, admin_token: str, library_item):
        """Returns 404 for non-existent category."""
        fake_category_id = uuid4()
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-BAD-001",
                "name": "Bad Category Exercise",
                "category_id": str(fake_category_id),
                "library_item_ids": [str(library_item.id)],
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_create_exercise_from_nonexistent_library_item(self, client: AsyncClient, admin_token: str, sample_category):
        """Returns 404 for non-existent library item."""
        fake_item_id = uuid4()
        response = await client.post(
            "/api/v1/exercise/exercises/from-items",
            json={
                "code": "EX-FAKE-001",
                "name": "Fake Item Exercise",
                "category_id": str(sample_category.id),
                "library_item_ids": [str(fake_item_id)],
            },
            headers={"Authorization": admin_token},
        )
        
        if response.status_code != 404:
            print(f"Response: {response.status_code}, Body: {response.text}")
        assert response.status_code == 404
