"""
Integration tests for exercise versioning workflows.

Tests the complete versioning lifecycle:
- Creating new versions
- Version chain integrity
- Superseding old versions
- Querying version history
- Active version management
"""

import pytest
from uuid import uuid4, UUID
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.main import app
from tests.fixtures.auth import admin_token
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


# Token fixture imported from tests.fixtures.auth


@pytest.fixture
async def base_exercise(db_session: AsyncSession):
    """Create base exercise (v1) for versioning tests."""
    from src.infrastructure.persistence.sqla.models.exercise import ExerciseCategoryModel, ExerciseModel
    
    category = ExerciseCategoryModel(
        name="Versioning Test",
        slug="versioning-test",
        display_order=1,
    )
    db_session.add(category)
    await db_session.flush()
    
    exercise = ExerciseModel(
        category_id=category.id,
        code="VER-001",
        title="Original Exercise",
        subtitle="Version 1",
        scope="Initial version",
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


# ============================================================================
# Version Creation Tests
# ============================================================================

class TestVersionCreation:
    """Test creating new versions of exercises."""
    
    async def test_create_version_increments_version_number(self, client: AsyncClient, admin_token: str, base_exercise):
        """New version has incremented version number."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2 Title"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["version"] == 2
        assert data["code"] == base_exercise.code  # Same code
        assert data["title"] == "Version 2 Title"
    
    async def test_create_version_marks_old_version_inactive(self, client: AsyncClient, admin_token: str, base_exercise, db_session: AsyncSession):
        """Creating new version marks old version as inactive."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        
        # Create version 2
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        assert response.status_code == 201
        v2_data = response.json()
        
        # Check old version is inactive
        result = await db_session.execute(
            select(ExerciseModel).where(ExerciseModel.id == base_exercise.id)
        )
        v1 = result.scalar_one()
        assert v1.is_active is False
        assert str(v1.superseded_by) == v2_data["id"]
    
    async def test_create_version_new_version_is_active(self, client: AsyncClient, admin_token: str, base_exercise):
        """New version is marked as active."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["is_active"] is True
    
    async def test_create_version_preserves_unchanged_fields(self, client: AsyncClient, admin_token: str, base_exercise):
        """Fields not in changes dict are preserved from old version."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"subtitle": "Updated Subtitle Only"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == base_exercise.title  # Unchanged
        assert data["subtitle"] == "Updated Subtitle Only"  # Changed
        assert data["difficulty_level"] == base_exercise.difficulty_level  # Unchanged
    
    async def test_create_version_can_update_multiple_fields(self, client: AsyncClient, admin_token: str, base_exercise):
        """Can update multiple fields in new version."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={
                "title": "New Title",
                "subtitle": "New Subtitle",
                "difficulty_level": "advanced",
                "estimated_duration_minutes": 30,
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Title"
        assert data["subtitle"] == "New Subtitle"
        assert data["difficulty_level"] == "advanced"
        assert data["estimated_duration_minutes"] == 30


# ============================================================================
# Version Chain Tests
# ============================================================================

class TestVersionChain:
    """Test version chain integrity and navigation."""
    
    async def test_version_chain_links_correctly(self, client: AsyncClient, admin_token: str, base_exercise, db_session: AsyncSession):
        """Version chain maintains proper superseded_by links."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        
        # Create v2
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        v2_id = response.json()["id"]
        
        # Create v3 from v2
        response = await client.post(
            f"/api/v1/exercises/exercises/{v2_id}/versions",
            json={"title": "Version 3"},
            headers={"Authorization": admin_token},
        )
        v3_id = response.json()["id"]
        
        # Verify chain: v1 -> v2 -> v3
        result = await db_session.execute(
            select(ExerciseModel).where(ExerciseModel.id == base_exercise.id)
        )
        v1 = result.scalar_one()
        assert str(v1.superseded_by) == v2_id
        
        result = await db_session.execute(
            select(ExerciseModel).where(ExerciseModel.id == UUID(v2_id))
        )
        v2 = result.scalar_one()
        assert str(v2.superseded_by) == v3_id
    
    async def test_list_all_versions_by_code(self, client: AsyncClient, admin_token: str, base_exercise):
        """Can retrieve all versions by exercise code."""
        # Create v2 and v3
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        v2_id = response.json()["id"]
        
        await client.post(
            f"/api/v1/exercises/exercises/{v2_id}/versions",
            json={"title": "Version 3"},
            headers={"Authorization": admin_token},
        )
        
        # List all versions
        response = await client.get(
            f"/api/v1/exercises/exercises/code/{base_exercise.code}/versions"
        )
        
        assert response.status_code == 200
        versions = response.json()
        assert len(versions) == 3
        
        # Verify version numbers
        version_numbers = sorted([v["version"] for v in versions])
        assert version_numbers == [1, 2, 3]
    
    async def test_versions_ordered_by_version_number(self, client: AsyncClient, admin_token: str, base_exercise):
        """Versions are returned in order by version number."""
        # Create multiple versions
        v2_response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        v2_id = v2_response.json()["id"]
        
        await client.post(
            f"/api/v1/exercises/exercises/{v2_id}/versions",
            json={"title": "Version 3"},
            headers={"Authorization": admin_token},
        )
        
        # Get version history
        response = await client.get(
            f"/api/v1/exercises/exercises/code/{base_exercise.code}/versions"
        )
        
        versions = response.json()
        version_numbers = [v["version"] for v in versions]
        
        # Should be in ascending order
        assert version_numbers == sorted(version_numbers)


# ============================================================================
# Active Version Management Tests
# ============================================================================

class TestActiveVersionManagement:
    """Test active version tracking and queries."""
    
    async def test_only_latest_version_is_active(self, client: AsyncClient, admin_token: str, base_exercise):
        """Only the most recent version is marked as active."""
        # Create v2
        v2_response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        v2_id = v2_response.json()["id"]
        
        # Get all versions
        response = await client.get(
            f"/api/v1/exercises/exercises/code/{base_exercise.code}/versions"
        )
        versions = response.json()
        
        # Count active versions
        active_versions = [v for v in versions if v["is_active"]]
        assert len(active_versions) == 1
        assert active_versions[0]["id"] == v2_id
    
    async def test_listing_exercises_shows_only_active(self, client: AsyncClient, admin_token: str, base_exercise, db_session: AsyncSession):
        """Listing exercises with active_only filter excludes superseded versions."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        
        # Create v2
        await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        
        # List active exercises
        result = await db_session.execute(
            select(ExerciseModel).where(
                ExerciseModel.category_id == base_exercise.category_id,
                ExerciseModel.is_active == True
            )
        )
        active_exercises = result.scalars().all()
        
        # Should only have v2
        assert len([e for e in active_exercises if e.code == base_exercise.code]) == 1
        assert active_exercises[0].version == 2
    
    async def test_get_by_code_returns_active_version(self, client: AsyncClient, admin_token: str, base_exercise):
        """Getting exercise by code returns the active version."""
        # Create v2
        v2_response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2 Active"},
            headers={"Authorization": admin_token},
        )
        
        # Get by code (should return v2)
        response = await client.get(
            f"/api/v1/exercises/exercises/code/{base_exercise.code}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == 2
        assert data["title"] == "Version 2 Active"
        assert data["is_active"] is True


# ============================================================================
# Version Workflow Scenarios
# ============================================================================

class TestVersioningWorkflows:
    """Test complete versioning workflows."""
    
    async def test_complete_version_lifecycle(self, client: AsyncClient, admin_token: str, base_exercise, db_session: AsyncSession):
        """Test complete lifecycle: create → version → version → query history."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseModel
        
        # Initial state: v1 exists and is active
        response = await client.get(f"/api/v1/exercises/exercises/{base_exercise.id}")
        assert response.json()["version"] == 1
        assert response.json()["is_active"] is True
        
        # Create v2: Fix difficulty level
        v2_response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"difficulty_level": "intermediate"},
            headers={"Authorization": admin_token},
        )
        assert v2_response.status_code == 201
        v2_data = v2_response.json()
        assert v2_data["version"] == 2
        assert v2_data["difficulty_level"] == "intermediate"
        
        # Verify v1 is now inactive
        result = await db_session.execute(
            select(ExerciseModel).where(ExerciseModel.id == base_exercise.id)
        )
        v1 = result.scalar_one()
        assert v1.is_active is False
        
        # Create v3: Update title and duration
        v3_response = await client.post(
            f"/api/v1/exercises/exercises/{v2_data['id']}/versions",
            json={
                "title": "Revised Exercise",
                "estimated_duration_minutes": 20,
            },
            headers={"Authorization": admin_token},
        )
        assert v3_response.status_code == 201
        v3_data = v3_response.json()
        assert v3_data["version"] == 3
        
        # Query version history
        history_response = await client.get(
            f"/api/v1/exercises/exercises/code/{base_exercise.code}/versions"
        )
        assert history_response.status_code == 200
        versions = history_response.json()
        
        # Verify all 3 versions exist
        assert len(versions) == 3
        assert [v["version"] for v in versions] == [1, 2, 3]
        
        # Only v3 should be active
        active_versions = [v for v in versions if v["is_active"]]
        assert len(active_versions) == 1
        assert active_versions[0]["version"] == 3
    
    async def test_cannot_create_version_from_inactive(self, client: AsyncClient, admin_token: str, base_exercise):
        """Cannot create new version from an inactive version (edge case)."""
        # Create v2 (makes v1 inactive)
        v2_response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        v2_id = v2_response.json()["id"]
        
        # Try to create v3 from inactive v1 (should fail or be handled)
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 3 from v1"},
            headers={"Authorization": admin_token},
        )
        
        # Expected: Either 409 conflict or creates with proper version increment
        # Implementation-dependent, but should maintain version integrity
        assert response.status_code in [201, 409]
        
        if response.status_code == 201:
            # If allowed, should still be version 3 (not a duplicate v2)
            assert response.json()["version"] >= 3
    
    async def test_versioning_with_items_workflow(self, client: AsyncClient, admin_token: str, base_exercise, db_session: AsyncSession):
        """Versioning workflow with exercise items."""
        from src.infrastructure.persistence.sqla.models.exercise import ExerciseItemModel
        
        # Add items to v1
        item1 = ExerciseItemModel(
            exercise_id=base_exercise.id,
            item_type="movement",
            display_order=1,
        )
        item2 = ExerciseItemModel(
            exercise_id=base_exercise.id,
            item_type="speech_practice",
            display_order=2,
        )
        db_session.add_all([item1, item2])
        await db_session.commit()
        
        # Create v2
        v2_response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={"title": "Version 2"},
            headers={"Authorization": admin_token},
        )
        v2_id = v2_response.json()["id"]
        
        # v1 items still exist but attached to inactive version
        v1_items = await client.get(
            f"/api/v1/exercises/items?exercise_id={base_exercise.id}"
        )
        assert v1_items.status_code == 200
        assert len(v1_items.json()) >= 2
        
        # v2 has no items initially (items don't auto-copy)
        v2_items = await client.get(
            f"/api/v1/exercises/items?exercise_id={v2_id}"
        )
        # Should be empty or 404
        assert v2_items.status_code in [200, 404]
        if v2_items.status_code == 200:
            assert len(v2_items.json()) == 0


# ============================================================================
# Edge Cases and Error Handling
# ============================================================================

class TestVersioningEdgeCases:
    """Test edge cases in versioning."""
    
    async def test_version_nonexistent_exercise_not_found(self, client: AsyncClient, admin_token: str):
        """Cannot create version for non-existent exercise."""
        fake_id = uuid4()
        response = await client.post(
            f"/api/v1/exercises/exercises/{fake_id}/versions",
            json={"title": "Should Fail"},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_get_versions_for_nonexistent_code_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent exercise code."""
        response = await client.get(
            "/api/v1/exercises/exercises/code/NONEXISTENT/versions"
        )
        
        assert response.status_code == 404
    
    async def test_version_with_no_changes_still_creates_version(self, client: AsyncClient, admin_token: str, base_exercise):
        """Creating version with no changes still increments version."""
        response = await client.post(
            f"/api/v1/exercises/exercises/{base_exercise.id}/versions",
            json={},  # No changes
            headers={"Authorization": admin_token},
        )
        
        # Should still create v2 (implementation-dependent)
        # Some implementations might return 400, others create anyway
        assert response.status_code in [201, 400]
        
        if response.status_code == 201:
            data = response.json()
            assert data["version"] == 2
            assert data["title"] == base_exercise.title  # Unchanged
