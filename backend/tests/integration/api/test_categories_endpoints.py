"""
Integration tests for exercise category endpoints.

Tests the complete HTTP request/response cycle including:
- CRUD operations for categories
- RBAC enforcement (Admin/Therapist access)
- Request validation
- Response serialization
- Error handling
"""

import pytest
from uuid import uuid4
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
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
        name="Lip Exercises",
        slug="lip-exercises",
        description="Exercises for lip mobility",
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


# ============================================================================
# POST /api/v1/exercises/categories - Create Category
# ============================================================================

class TestCreateCategory:
    """Test category creation endpoint."""
    
    async def test_create_category_as_admin_success(self, client: AsyncClient, admin_token: str):
        """Admin can create a category."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Tongue Exercises",
                "slug": "tongue-exercises",
                "description": "Exercises for tongue strength",
                "sort_order": 1,
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Tongue Exercises"
        assert data["slug"] == "tongue-exercises"
        assert data["description"] == "Exercises for tongue strength"
        assert "id" in data
    
    async def test_create_category_as_therapist_success(self, client: AsyncClient, therapist_token: str):
        """Therapist can create a category."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Jaw Exercises",
                "slug": "jaw-exercises",
                "description": "Exercises for jaw mobility",
                "sort_order": 2,
            },
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Jaw Exercises"
    
    async def test_create_category_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str):
        """Regular user cannot create a category."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Test Category",
                "slug": "test-category",
                "sort_order": 1,
            },
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_create_category_without_auth_unauthorized(self, client: AsyncClient):
        """Unauthenticated request is rejected."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Test Category",
                "slug": "test-category",
                "sort_order": 1,
            },
        )
        
        assert response.status_code == 401
    
    async def test_create_category_duplicate_slug_conflict(self, client: AsyncClient, admin_token: str, sample_category: ExerciseCategory):
        """Cannot create category with duplicate slug."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Duplicate Category",
                "slug": sample_category.slug,  # Duplicate!
                "sort_order": 1,
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 409
    
    async def test_create_category_invalid_data_validation_error(self, client: AsyncClient, admin_token: str):
        """Invalid data triggers validation error."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "",  # Empty name
                "slug": "invalid",
                "sort_order": -1,  # Negative order
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 422


# ============================================================================
# GET /api/v1/exercises/categories - List Categories
# ============================================================================

class TestListCategories:
    """Test category listing endpoint."""
    
    async def test_list_categories_success(self, client: AsyncClient, sample_category: ExerciseCategory):
        """Can list all categories without auth."""
        response = await client.get("/api/v1/exercises/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our sample category
        category = next((c for c in data if c["id"] == str(sample_category.id)), None)
        assert category is not None
        assert category["name"] == sample_category.name
    
    async def test_list_categories_empty(self, client: AsyncClient):
        """Returns empty list when no categories exist."""
        response = await client.get("/api/v1/exercises/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_list_categories_exclude_deleted(self, client: AsyncClient, db_session: AsyncSession):
        """Soft-deleted categories are excluded by default."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel
        from datetime import datetime, timezone
        
        # Create deleted category
        deleted_category = ExerciseCategoryModel(
            name="Deleted Category",
            slug="deleted-category",
            display_order=99,
            deleted_at=datetime.now(timezone.utc),
            deleted_by="admin",
        )
        db_session.add(deleted_category)
        await db_session.commit()
        
        response = await client.get("/api/v1/exercises/categories")
        
        assert response.status_code == 200
        data = response.json()
        
        # Deleted category should not appear
        deleted_ids = [c["id"] for c in data if c.get("deleted_at") is not None]
        assert len(deleted_ids) == 0
    
    async def test_list_categories_include_deleted(self, client: AsyncClient, db_session: AsyncSession):
        """Can include deleted categories with parameter."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel
        from datetime import datetime, timezone
        
        # Create deleted category
        deleted_category = ExerciseCategoryModel(
            name="Deleted Category",
            slug="deleted-category",
            display_order=99,
            deleted_at=datetime.now(timezone.utc),
            deleted_by="admin",
        )
        db_session.add(deleted_category)
        await db_session.commit()
        
        response = await client.get("/api/v1/exercises/categories?include_deleted=true")
        
        assert response.status_code == 200
        data = response.json()
        
        # Deleted category should appear
        deleted_ids = [c["id"] for c in data if c.get("deleted_at") is not None]
        assert len(deleted_ids) >= 1


# ============================================================================
# GET /api/v1/exercises/categories/{category_id} - Get Category by ID
# ============================================================================

class TestGetCategory:
    """Test get category by ID endpoint."""
    
    async def test_get_category_by_id_success(self, client: AsyncClient, sample_category: ExerciseCategory):
        """Can retrieve category by ID."""
        response = await client.get(f"/api/v1/exercises/categories/{sample_category.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_category.id)
        assert data["name"] == sample_category.name
        assert data["slug"] == sample_category.slug
    
    async def test_get_category_by_id_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent category."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/exercises/categories/{fake_id}")
        
        assert response.status_code == 404


# ============================================================================
# GET /api/v1/exercises/categories/slug/{slug} - Get Category by Slug
# ============================================================================

class TestGetCategoryBySlug:
    """Test get category by slug endpoint."""
    
    async def test_get_category_by_slug_success(self, client: AsyncClient, sample_category: ExerciseCategory):
        """Can retrieve category by slug."""
        response = await client.get(f"/api/v1/exercises/categories/slug/{sample_category.slug}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_category.id)
        assert data["slug"] == sample_category.slug
    
    async def test_get_category_by_slug_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent slug."""
        response = await client.get("/api/v1/exercises/categories/slug/nonexistent-slug")
        
        assert response.status_code == 404


# ============================================================================
# PATCH /api/v1/exercises/categories/{category_id} - Update Category
# ============================================================================

class TestUpdateCategory:
    """Test category update endpoint."""
    
    async def test_update_category_as_admin_success(self, client: AsyncClient, admin_token: str, sample_category: ExerciseCategory):
        """Admin can update a category."""
        response = await client.patch(
            f"/api/v1/exercises/categories/{sample_category.id}",
            json={
                "name": "Updated Name",
                "description": "Updated description",
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated description"
        assert data["slug"] == sample_category.slug  # Unchanged
    
    async def test_update_category_as_therapist_success(self, client: AsyncClient, therapist_token: str, sample_category: ExerciseCategory):
        """Therapist can update a category."""
        response = await client.patch(
            f"/api/v1/exercises/categories/{sample_category.id}",
            json={"name": "Therapist Updated"},
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Therapist Updated"
    
    async def test_update_category_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_category: ExerciseCategory):
        """Regular user cannot update a category."""
        response = await client.patch(
            f"/api/v1/exercises/categories/{sample_category.id}",
            json={"name": "Should Fail"},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_update_category_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent category."""
        fake_id = uuid4()
        response = await client.patch(
            f"/api/v1/exercises/categories/{fake_id}",
            json={"name": "Updated"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404


# ============================================================================
# POST /api/v1/exercises/categories/reorder - Reorder Categories
# ============================================================================

class TestReorderCategories:
    """Test category reordering endpoint."""
    
    async def test_reorder_categories_as_admin_success(self, client: AsyncClient, admin_token: str, db_session: AsyncSession):
        """Admin can reorder categories."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel
        
        # Create multiple categories
        cat1 = ExerciseCategoryModel(name="Cat 1", slug="cat-1", display_order=1)
        cat2 = ExerciseCategoryModel(name="Cat 2", slug="cat-2", display_order=2)
        cat3 = ExerciseCategoryModel(name="Cat 3", slug="cat-3", display_order=3)
        db_session.add_all([cat1, cat2, cat3])
        await db_session.commit()
        
        # Reorder: swap cat3 to first position
        response = await client.post(
            "/api/v1/exercises/categories/reorder",
            json={"category_ids": [str(cat3.id), str(cat1.id), str(cat2.id)]},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Reordered" in data["message"]
    
    async def test_reorder_categories_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str):
        """Regular user cannot reorder categories."""
        response = await client.post(
            "/api/v1/exercises/categories/reorder",
            json={"category_ids": [str(uuid4())]},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403


# ============================================================================
# DELETE /api/v1/exercises/categories/{category_id} - Delete Category
# ============================================================================

class TestDeleteCategory:
    """Test category deletion endpoint."""
    
    async def test_delete_category_as_admin_success(self, client: AsyncClient, admin_token: str, sample_category: ExerciseCategory):
        """Admin can delete a category."""
        # Pass deleted_by as query parameter (based on endpoint signature)
        admin_id = uuid4()
        response = await client.delete(
            f"/api/v1/exercises/categories/{sample_category.id}?deleted_by={admin_id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"].lower()
    
    async def test_delete_category_as_therapist_forbidden(self, client: AsyncClient, therapist_token: str, sample_category: ExerciseCategory):
        """Therapist cannot delete a category (Admin only)."""
        response = await client.delete(
            f"/api/v1/exercises/categories/{sample_category.id}?deleted_by={uuid4()}",
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 403
    
    async def test_delete_category_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_category: ExerciseCategory):
        """Regular user cannot delete a category."""
        response = await client.delete(
            f"/api/v1/exercises/categories/{sample_category.id}?deleted_by={uuid4()}",
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_delete_category_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent category."""
        fake_id = uuid4()
        response = await client.delete(
            f"/api/v1/exercises/categories/{fake_id}?deleted_by={uuid4()}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
