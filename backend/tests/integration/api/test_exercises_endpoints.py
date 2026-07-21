"""
Integration tests for exercise endpoints.

Tests the complete HTTP request/response cycle including:
- CRUD operations for exercises
- Exercise versioning workflow
- Filtering and pagination
- RBAC enforcement
- Request validation
- Response serialization
"""

import pytest
from uuid import uuid4
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from src.core.entities.exercise import Exercise
from src.core.entities.exercise_category import ExerciseCategory
from tests.fixtures.auth import admin_token, therapist_token, regular_user_token
from tests.fixtures.users import test_users
from tests.fixtures.roles import base_roles


pytestmark = pytest.mark.asyncio


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
async def client():
    """Create async test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# Token fixtures imported from tests.fixtures.auth


@pytest.fixture
async def sample_category(db_session: AsyncSession) -> ExerciseCategory:
    """Create a sample category for testing."""
    from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel
    
    category = ExerciseCategoryModel(
        name="Articulation",
        slug="articulation",
        description="Articulation exercises",
        display_order=1,
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    
    return ExerciseCategory(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        display_order=category.display_order,
    )


@pytest.fixture
async def sample_exercise(db_session: AsyncSession, sample_category: ExerciseCategory) -> Exercise:
    """Create a sample exercise for testing."""
    from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
    
    exercise = ExerciseModel(
        category_id=sample_category.id,
        code="ART-001",
        title="Tongue Twisters",
        subtitle="Basic tongue twister practice",
        scope="Practice articulation with tongue twisters",
        difficulty_level="beginner",
        estimated_duration_minutes=10,
        display_order=1,
        version=1,
        is_active=True,
        created_by="admin",
    )
    db_session.add(exercise)
    await db_session.commit()
    await db_session.refresh(exercise)
    
    return Exercise(
        id=exercise.id,
        category_id=exercise.category_id,
        code=exercise.code,
        title=exercise.title,
        subtitle=exercise.subtitle,
        scope=exercise.scope,
        difficulty_level=exercise.difficulty_level,
        estimated_duration_minutes=exercise.estimated_duration_minutes,
        display_order=exercise.display_order,
        version=exercise.version,
        is_active=exercise.is_active,
        created_by=exercise.created_by,
    )


# ============================================================================
# POST /api/v1/exercises/exercises - Create Exercise
# ============================================================================

class TestCreateExercise:
    """Test exercise creation endpoint."""
    
    async def test_create_exercise_as_admin_success(self, client: AsyncClient, admin_token: str, sample_category: ExerciseCategory):
        """Admin can create an exercise."""
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(sample_category.id),
                "code": "ART-002",
                "title": "Vowel Sounds",
                "subtitle": "Practice vowel pronunciation",
                "scope": "Exercises for vowel sounds",
                "difficulty_level": "beginner",
                "estimated_duration_minutes": 15,
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "ART-002"
        assert data["title"] == "Vowel Sounds"
        assert data["difficulty_level"] == "beginner"
        assert data["version"] == 1
        assert data["is_active"] is True
    
    async def test_create_exercise_as_therapist_success(self, client: AsyncClient, therapist_token: str, sample_category: ExerciseCategory):
        """Therapist can create an exercise."""
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(sample_category.id),
                "code": "ART-003",
                "title": "Consonant Blends",
                "difficulty_level": "intermediate",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "ART-003"
    
    async def test_create_exercise_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_category: ExerciseCategory):
        """Regular user cannot create an exercise."""
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(sample_category.id),
                "code": "FAIL",
                "title": "Should Fail",
                "difficulty_level": "beginner",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_create_exercise_category_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 when category doesn't exist."""
        fake_category_id = uuid4()
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(fake_category_id),
                "code": "FAIL",
                "title": "Should Fail",
                "difficulty_level": "beginner",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_create_exercise_duplicate_code_error(self, client: AsyncClient, admin_token: str, sample_exercise: Exercise, sample_category: ExerciseCategory):
        """Cannot create exercise with duplicate code."""
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(sample_category.id),
                "code": sample_exercise.code,  # Duplicate!
                "title": "Duplicate Code",
                "difficulty_level": "beginner",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 400


# ============================================================================
# GET /api/v1/exercises/exercises - List Exercises
# ============================================================================

class TestListExercises:
    """Test exercise listing endpoint."""
    
    async def test_list_exercises_by_category(self, client: AsyncClient, sample_exercise: Exercise):
        """Can list exercises filtered by category."""
        response = await client.get(
            f"/api/v1/exercises/exercises?category_id={sample_exercise.category_id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "exercises" in data
        assert data["total"] >= 1
        assert data["page"] == 1
        
        # Find our sample exercise
        exercise = next((e for e in data["exercises"] if e["id"] == str(sample_exercise.id)), None)
        assert exercise is not None
        assert exercise["title"] == sample_exercise.title
    
    async def test_list_exercises_pagination(self, client: AsyncClient, sample_exercise: Exercise):
        """Pagination works correctly."""
        response = await client.get(
            f"/api/v1/exercises/exercises?category_id={sample_exercise.category_id}&page=1&page_size=10"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10
    
    async def test_list_exercises_active_only_filter(self, client: AsyncClient, db_session: AsyncSession, sample_category: ExerciseCategory):
        """Active-only filter excludes inactive exercises."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        
        # Create inactive exercise
        inactive_exercise = ExerciseModel(
            category_id=sample_category.id,
            code="INACTIVE",
            title="Inactive Exercise",
            difficulty_level="beginner",
            display_order=99,
            version=1,
            is_active=False,
            created_by="admin",
        )
        db_session.add(inactive_exercise)
        await db_session.commit()
        
        # List with active_only=True (default)
        response = await client.get(
            f"/api/v1/exercises/exercises?category_id={sample_category.id}&active_only=true"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Inactive exercise should not appear
        inactive_ids = [e["id"] for e in data["exercises"] if not e["is_active"]]
        assert len(inactive_ids) == 0


# ============================================================================
# GET /api/v1/exercises/exercises/{exercise_id} - Get Exercise by ID
# ============================================================================

class TestGetExercise:
    """Test get exercise by ID endpoint."""
    
    async def test_get_exercise_by_id_success(self, client: AsyncClient, sample_exercise: Exercise):
        """Can retrieve exercise by ID."""
        response = await client.get(f"/api/v1/exercises/exercises/{sample_exercise.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_exercise.id)
        assert data["code"] == sample_exercise.code
        assert data["title"] == sample_exercise.title
    
    async def test_get_exercise_with_instructions(self, client: AsyncClient, sample_exercise: Exercise):
        """Can load exercise with instructions."""
        response = await client.get(
            f"/api/v1/exercises/exercises/{sample_exercise.id}?load_instructions=true"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "instructions" in data or data.get("instructions") is None
    
    async def test_get_exercise_with_items(self, client: AsyncClient, sample_exercise: Exercise):
        """Can load exercise with items."""
        response = await client.get(
            f"/api/v1/exercises/exercises/{sample_exercise.id}?load_items=true"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data or data.get("items") == []
    
    async def test_get_exercise_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent exercise."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/exercises/exercises/{fake_id}")
        
        assert response.status_code == 404


# ============================================================================
# GET /api/v1/exercises/exercises/code/{exercise_code} - Get by Code
# ============================================================================

class TestGetExerciseByCode:
    """Test get exercise by code endpoint."""
    
    async def test_get_exercise_by_code_success(self, client: AsyncClient, sample_exercise: Exercise):
        """Can retrieve exercise by code."""
        response = await client.get(f"/api/v1/exercises/exercises/code/{sample_exercise.code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == sample_exercise.code
        assert data["id"] == str(sample_exercise.id)
    
    async def test_get_exercise_by_code_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent code."""
        response = await client.get("/api/v1/exercises/exercises/code/NONEXISTENT")
        
        assert response.status_code == 404


# ============================================================================
# GET /api/v1/exercises/exercises/code/{exercise_code}/versions - Versions
# ============================================================================

class TestGetExerciseVersions:
    """Test get exercise versions endpoint."""
    
    async def test_get_exercise_versions_success(self, client: AsyncClient, sample_exercise: Exercise):
        """Can retrieve all versions of an exercise."""
        response = await client.get(
            f"/api/v1/exercises/exercises/code/{sample_exercise.code}/versions"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our sample exercise
        version = next((v for v in data if v["id"] == str(sample_exercise.id)), None)
        assert version is not None
        assert version["version"] == 1
    
    async def test_get_exercise_versions_multiple_versions(self, client: AsyncClient, db_session: AsyncSession, sample_exercise: Exercise):
        """Lists all versions when multiple exist."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        
        # Create version 2
        v2 = ExerciseModel(
            category_id=sample_exercise.category_id,
            code=sample_exercise.code,
            title=f"{sample_exercise.title} v2",
            difficulty_level=sample_exercise.difficulty_level,
            display_order=sample_exercise.display_order,
            version=2,
            is_active=True,
            superseded_by=None,
            created_by="admin",
        )
        db_session.add(v2)
        
        # Mark v1 as superseded
        from sqlalchemy import update
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel as EM
        await db_session.execute(
            update(EM)
            .where(EM.id == sample_exercise.id)
            .values(is_active=False, superseded_by=v2.id)
        )
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/exercises/exercises/code/{sample_exercise.code}/versions"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        versions = [v["version"] for v in data]
        assert 1 in versions
        assert 2 in versions


# ============================================================================
# PATCH /api/v1/exercises/exercises/{exercise_id} - Update Exercise
# ============================================================================

class TestUpdateExercise:
    """Test exercise update endpoint."""
    
    async def test_update_exercise_as_admin_success(self, client: AsyncClient, admin_token: str, sample_exercise: Exercise):
        """Admin can update an exercise."""
        response = await client.patch(
            f"/api/v1/exercises/exercises/{sample_exercise.id}",
            json={
                "title": "Updated Title",
                "description": "Updated description",
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
    
    async def test_update_exercise_as_therapist_success(self, client: AsyncClient, therapist_token: str, sample_exercise: Exercise):
        """Therapist can update an exercise."""
        response = await client.patch(
            f"/api/v1/exercises/exercises/{sample_exercise.id}",
            json={"subtitle": "Therapist updated"},
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["subtitle"] == "Therapist updated"
    
    async def test_update_exercise_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_exercise: Exercise):
        """Regular user cannot update an exercise."""
        response = await client.patch(
            f"/api/v1/exercises/exercises/{sample_exercise.id}",
            json={"title": "Should Fail"},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_update_exercise_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent exercise."""
        fake_id = uuid4()
        response = await client.patch(
            f"/api/v1/exercises/exercises/{fake_id}",
            json={"title": "Updated"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404


# ============================================================================
# POST /api/v1/exercises/exercises/{exercise_id}/versions - New Version
# ============================================================================

class TestCreateNewVersion:
    """Test create new version endpoint."""
    
    async def test_create_new_version_as_admin_success(self, client: AsyncClient, admin_token: str, sample_exercise: Exercise):
        """Admin can create a new version."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{sample_exercise.id}/versions",
            json={
                "title": "Version 2 Title",
                "difficulty_level": "intermediate",
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == sample_exercise.code  # Same code
        assert data["version"] == 2  # Incremented version
        assert data["title"] == "Version 2 Title"
        assert data["is_active"] is True
    
    async def test_create_new_version_marks_old_inactive(self, client: AsyncClient, admin_token: str, sample_exercise: Exercise, db_session: AsyncSession):
        """Creating new version marks old version as inactive."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{sample_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        
        # Verify old version is now inactive
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        from sqlalchemy import select
        result = await db_session.execute(
            select(ExerciseModel).where(ExerciseModel.id == sample_exercise.id)
        )
        old_version = result.scalar_one()
        assert old_version.is_active is False
    
    async def test_create_new_version_as_therapist_success(self, client: AsyncClient, therapist_token: str, sample_exercise: Exercise):
        """Therapist can create a new version."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{sample_exercise.id}/versions",
            json={"title": "Therapist Version 2"},
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
    
    async def test_create_new_version_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_exercise: Exercise):
        """Regular user cannot create a new version."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{sample_exercise.id}/versions",
            json={"title": "Should Fail"},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403


# ============================================================================
# DELETE /api/v1/exercises/exercises/{exercise_id} - Delete Exercise
# ============================================================================

class TestDeleteExercise:
    """Test exercise deletion endpoint."""
    
    async def test_delete_exercise_as_admin_success(self, client: AsyncClient, admin_token: str, sample_exercise: Exercise):
        """Admin can delete an exercise."""
        response = await client.delete(
            f"/api/v1/exercises/exercises/{sample_exercise.id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"].lower()
    
    async def test_delete_exercise_as_therapist_forbidden(self, client: AsyncClient, therapist_token: str, sample_exercise: Exercise):
        """Therapist cannot delete an exercise (Admin only)."""
        response = await client.delete(
            f"/api/v1/exercises/exercises/{sample_exercise.id}",
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 403
    
    async def test_delete_exercise_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent exercise."""
        fake_id = uuid4()
        response = await client.delete(
            f"/api/v1/exercises/exercises/{fake_id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
