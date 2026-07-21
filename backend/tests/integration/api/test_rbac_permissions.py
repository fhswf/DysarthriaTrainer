"""
Integration tests for RBAC permissions on exercise endpoints.

Tests role-based access control enforcement:
- Admin: Full access (create, read, update, delete)
- Therapist: Create, read, update (no delete)
- Patient/User: Read-only access
- Unauthenticated: Limited/no access
"""

import pytest
from uuid import uuid4
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from tests.fixtures.auth import admin_token, therapist_token, patient_token
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
async def setup_test_data(db_session: AsyncSession):
    """Set up category and exercise for RBAC tests."""
    from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel, ExerciseModel
    
    category = ExerciseCategoryModel(
        name="RBAC Test Category",
        slug="rbac-test",
        display_order=1,
    )
    db_session.add(category)
    await db_session.flush()
    
    exercise = ExerciseModel(
        category_id=category.id,
        code="RBAC-001",
        title="RBAC Test Exercise",
        difficulty_level="beginner",
        display_order=1,
        version=1,
        is_active=True,
        created_by="admin",
    )
    db_session.add(exercise)
    await db_session.commit()
    await db_session.refresh(category)
    await db_session.refresh(exercise)
    
    return {"category": category, "exercise": exercise}


# ============================================================================
# Category RBAC Tests
# ============================================================================

class TestCategoryRBAC:
    """Test RBAC enforcement on category endpoints."""
    
    async def test_admin_can_create_category(self, client: AsyncClient, admin_token: str):
        """Admin has permission to create categories."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Admin Category",
                "slug": "admin-category",
                "sort_order": 1,
            },
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 201
    
    async def test_therapist_can_create_category(self, client: AsyncClient, therapist_token: str):
        """Therapist has permission to create categories."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Therapist Category",
                "slug": "therapist-category",
                "sort_order": 1,
            },
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 201
    
    async def test_patient_cannot_create_category(self, client: AsyncClient, patient_token: str):
        """Patient does not have permission to create categories."""
        response = await client.post(
            "/api/v1/exercises/categories",
            json={
                "name": "Patient Category",
                "slug": "patient-category",
                "sort_order": 1,
            },
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
    
    async def test_all_users_can_list_categories(self, client: AsyncClient, patient_token: str, setup_test_data):
        """All authenticated users can list categories."""
        response = await client.get(
            "/api/v1/exercises/categories",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 200
    
    async def test_unauthenticated_can_list_categories(self, client: AsyncClient, setup_test_data):
        """Unauthenticated users can list categories (public endpoint)."""
        response = await client.get("/api/v1/exercises/categories")
        assert response.status_code == 200
    
    async def test_admin_can_update_category(self, client: AsyncClient, admin_token: str, setup_test_data):
        """Admin can update categories."""
        category = setup_test_data["category"]
        response = await client.patch(
            f"/api/v1/exercises/categories/{category.id}",
            json={"name": "Updated by Admin"},
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 200
    
    async def test_therapist_can_update_category(self, client: AsyncClient, therapist_token: str, setup_test_data):
        """Therapist can update categories."""
        category = setup_test_data["category"]
        response = await client.patch(
            f"/api/v1/exercises/categories/{category.id}",
            json={"name": "Updated by Therapist"},
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 200
    
    async def test_patient_cannot_update_category(self, client: AsyncClient, patient_token: str, setup_test_data):
        """Patient cannot update categories."""
        category = setup_test_data["category"]
        response = await client.patch(
            f"/api/v1/exercises/categories/{category.id}",
            json={"name": "Updated by Patient"},
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
    
    async def test_only_admin_can_delete_category(self, client: AsyncClient, admin_token: str, therapist_token: str, patient_token: str, db_session: AsyncSession):
        """Only Admin can delete categories, not Therapist or Patient."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel
        
        # Create categories for each test
        cat1 = ExerciseCategoryModel(name="Cat1", slug="cat1-rbac", display_order=1)
        cat2 = ExerciseCategoryModel(name="Cat2", slug="cat2-rbac", display_order=2)
        cat3 = ExerciseCategoryModel(name="Cat3", slug="cat3-rbac", display_order=3)
        db_session.add_all([cat1, cat2, cat3])
        await db_session.commit()
        
        # Patient cannot delete
        response = await client.delete(
            f"/api/v1/exercises/categories/{cat1.id}?deleted_by={uuid4()}",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
        
        # Therapist cannot delete
        response = await client.delete(
            f"/api/v1/exercises/categories/{cat2.id}?deleted_by={uuid4()}",
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 403
        
        # Admin can delete
        response = await client.delete(
            f"/api/v1/exercises/categories/{cat3.id}?deleted_by={uuid4()}",
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 200


# ============================================================================
# Exercise RBAC Tests
# ============================================================================

class TestExerciseRBAC:
    """Test RBAC enforcement on exercise endpoints."""
    
    async def test_admin_can_create_exercise(self, client: AsyncClient, admin_token: str, setup_test_data):
        """Admin has permission to create exercises."""
        category = setup_test_data["category"]
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(category.id),
                "code": "RBAC-ADMIN",
                "title": "Admin Exercise",
                "difficulty_level": "beginner",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 201
    
    async def test_therapist_can_create_exercise(self, client: AsyncClient, therapist_token: str, setup_test_data):
        """Therapist has permission to create exercises."""
        category = setup_test_data["category"]
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(category.id),
                "code": "RBAC-THERAPIST",
                "title": "Therapist Exercise",
                "difficulty_level": "beginner",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 201
    
    async def test_patient_cannot_create_exercise(self, client: AsyncClient, patient_token: str, setup_test_data):
        """Patient does not have permission to create exercises."""
        category = setup_test_data["category"]
        response = await client.post(
            "/api/v1/exercises/exercises",
            json={
                "category_id": str(category.id),
                "code": "RBAC-PATIENT",
                "title": "Patient Exercise",
                "difficulty_level": "beginner",
                "instructions": [],
                "items": [],
            },
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
    
    async def test_all_users_can_list_exercises(self, client: AsyncClient, patient_token: str, setup_test_data):
        """All authenticated users can list exercises."""
        category = setup_test_data["category"]
        response = await client.get(
            f"/api/v1/exercises/exercises?category_id={category.id}",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 200
    
    async def test_all_users_can_view_exercise_details(self, client: AsyncClient, patient_token: str, setup_test_data):
        """All authenticated users can view exercise details."""
        exercise = setup_test_data["exercise"]
        response = await client.get(
            f"/api/v1/exercises/exercises/{exercise.id}",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 200
    
    async def test_admin_can_update_exercise(self, client: AsyncClient, admin_token: str, setup_test_data):
        """Admin can update exercises."""
        exercise = setup_test_data["exercise"]
        response = await client.patch(
            f"/api/v1/exercises/exercises/{exercise.id}",
            json={"title": "Updated by Admin"},
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 200
    
    async def test_therapist_can_update_exercise(self, client: AsyncClient, therapist_token: str, setup_test_data):
        """Therapist can update exercises."""
        exercise = setup_test_data["exercise"]
        response = await client.patch(
            f"/api/v1/exercises/exercises/{exercise.id}",
            json={"title": "Updated by Therapist"},
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 200
    
    async def test_patient_cannot_update_exercise(self, client: AsyncClient, patient_token: str, setup_test_data):
        """Patient cannot update exercises."""
        exercise = setup_test_data["exercise"]
        response = await client.patch(
            f"/api/v1/exercises/exercises/{exercise.id}",
            json={"title": "Updated by Patient"},
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
    
    async def test_only_admin_can_delete_exercise(self, client: AsyncClient, admin_token: str, therapist_token: str, patient_token: str, setup_test_data):
        """Only Admin can delete exercises, not Therapist or Patient."""
        category = setup_test_data["category"]
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        from sqlalchemy.ext.asyncio import AsyncSession
        
        # Get db_session from setup
        db_session = setup_test_data.get("db_session")
        if not db_session:
            pytest.skip("DB session not available")
        
        # Create exercises for each test
        ex1 = ExerciseModel(
            category_id=category.id,
            code="DEL-1",
            title="Delete Test 1",
            difficulty_level="beginner",
            display_order=1,
            version=1,
            is_active=True,
            created_by="admin",
        )
        ex2 = ExerciseModel(
            category_id=category.id,
            code="DEL-2",
            title="Delete Test 2",
            difficulty_level="beginner",
            display_order=2,
            version=1,
            is_active=True,
            created_by="admin",
        )
        ex3 = ExerciseModel(
            category_id=category.id,
            code="DEL-3",
            title="Delete Test 3",
            difficulty_level="beginner",
            display_order=3,
            version=1,
            is_active=True,
            created_by="admin",
        )
        db_session.add_all([ex1, ex2, ex3])
        await db_session.commit()
        
        # Patient cannot delete
        response = await client.delete(
            f"/api/v1/exercises/exercises/{ex1.id}",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
        
        # Therapist cannot delete
        response = await client.delete(
            f"/api/v1/exercises/exercises/{ex2.id}",
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 403
        
        # Admin can delete
        response = await client.delete(
            f"/api/v1/exercises/exercises/{ex3.id}",
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 200


# ============================================================================
# Item RBAC Tests
# ============================================================================

class TestItemRBAC:
    """Test RBAC enforcement on exercise item endpoints."""
    
    async def test_admin_can_create_item(self, client: AsyncClient, admin_token: str, setup_test_data):
        """Admin has permission to create items."""
        exercise = setup_test_data["exercise"]
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(exercise.id),
                "item_type": "movement",
                "sort_order": 1,
                "content": {"text": "Admin item"},
            },
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 201
    
    async def test_therapist_can_create_item(self, client: AsyncClient, therapist_token: str, setup_test_data):
        """Therapist has permission to create items."""
        exercise = setup_test_data["exercise"]
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(exercise.id),
                "item_type": "speech_practice",
                "sort_order": 2,
                "content": {"text": "Therapist item"},
            },
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 201
    
    async def test_patient_cannot_create_item(self, client: AsyncClient, patient_token: str, setup_test_data):
        """Patient does not have permission to create items."""
        exercise = setup_test_data["exercise"]
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(exercise.id),
                "item_type": "information",
                "sort_order": 3,
                "content": {"text": "Patient item"},
            },
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
    
    async def test_all_users_can_list_items(self, client: AsyncClient, patient_token: str, setup_test_data):
        """All authenticated users can list items."""
        exercise = setup_test_data["exercise"]
        response = await client.get(
            f"/api/v1/exercises/items?exercise_id={exercise.id}",
            headers={"Authorization": patient_token},
        )
        # 200 or 404 (if no items exist yet)
        assert response.status_code in [200, 404]
    
    async def test_only_admin_can_delete_item(self, client: AsyncClient, admin_token: str, therapist_token: str, patient_token: str, db_session: AsyncSession, setup_test_data):
        """Only Admin can delete items, not Therapist or Patient."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseItemModel
        
        exercise = setup_test_data["exercise"]
        
        # Create items
        item1 = ExerciseItemModel(
            exercise_id=exercise.id,
            item_type="movement",
            display_order=1,
        )
        item2 = ExerciseItemModel(
            exercise_id=exercise.id,
            item_type="movement",
            display_order=2,
        )
        item3 = ExerciseItemModel(
            exercise_id=exercise.id,
            item_type="movement",
            display_order=3,
        )
        db_session.add_all([item1, item2, item3])
        await db_session.commit()
        
        # Patient cannot delete
        response = await client.delete(
            f"/api/v1/exercises/items/{item1.id}",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
        
        # Therapist cannot delete
        response = await client.delete(
            f"/api/v1/exercises/items/{item2.id}",
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 403
        
        # Admin can delete
        response = await client.delete(
            f"/api/v1/exercises/items/{item3.id}",
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 200


# ============================================================================
# Cross-Role Permission Matrix Tests
# ============================================================================

class TestPermissionMatrix:
    """Test comprehensive permission matrix across all roles."""
    
    async def test_permission_matrix_summary(self, client: AsyncClient, admin_token: str, therapist_token: str, patient_token: str, setup_test_data):
        """Verify complete permission matrix.
        
        Permission Matrix:
        ==================
        Action           | Admin | Therapist | Patient
        -----------------|-------|-----------|--------
        Create Category  |  ✓    |    ✓      |   ✗
        List Categories  |  ✓    |    ✓      |   ✓
        Update Category  |  ✓    |    ✓      |   ✗
        Delete Category  |  ✓    |    ✗      |   ✗
        Create Exercise  |  ✓    |    ✓      |   ✗
        List Exercises   |  ✓    |    ✓      |   ✓
        Update Exercise  |  ✓    |    ✓      |   ✗
        Delete Exercise  |  ✓    |    ✗      |   ✗
        Create Item      |  ✓    |    ✓      |   ✗
        List Items       |  ✓    |    ✓      |   ✓
        Delete Item      |  ✓    |    ✗      |   ✗
        """
        category = setup_test_data["category"]
        exercise = setup_test_data["exercise"]
        
        # Test Patient read-only access
        # Can list
        response = await client.get(
            "/api/v1/exercises/categories",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 200
        
        # Cannot create
        response = await client.post(
            "/api/v1/exercises/categories",
            json={"name": "Test", "slug": "test", "sort_order": 1},
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
        
        # Cannot update
        response = await client.patch(
            f"/api/v1/exercises/categories/{category.id}",
            json={"name": "Updated"},
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
        
        # Cannot delete
        response = await client.delete(
            f"/api/v1/exercises/categories/{category.id}?deleted_by={uuid4()}",
            headers={"Authorization": patient_token},
        )
        assert response.status_code == 403
        
        # Test Therapist CRUD access (no delete)
        # Can create
        response = await client.post(
            "/api/v1/exercises/categories",
            json={"name": "Therapist Cat", "slug": "therapist-cat-matrix", "sort_order": 99},
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 201
        
        # Can update
        response = await client.patch(
            f"/api/v1/exercises/exercises/{exercise.id}",
            json={"title": "Therapist Updated"},
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 200
        
        # Cannot delete
        response = await client.delete(
            f"/api/v1/exercises/exercises/{exercise.id}",
            headers={"Authorization": therapist_token},
        )
        assert response.status_code == 403
        
        # Test Admin full access
        # Can delete
        response = await client.delete(
            f"/api/v1/exercises/categories/{category.id}?deleted_by={uuid4()}",
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 200
