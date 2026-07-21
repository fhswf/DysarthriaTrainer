"""
Integration tests for exercise item endpoints.

Tests the complete HTTP request/response cycle including:
- Adding items to exercises
- Retrieving items with filtering
- Reordering items
- Deleting items
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
    
    # Store current user for authentication override
    current_test_user = None
    
    async def override_session():
        yield db_session
    
    async def override_current_user():
        # Return the appropriate test user based on the token
        # For now, return admin user by default
        # Individual tests can override this if needed
        if current_test_user:
            return current_test_user
        return test_users["admin"]
    
    # Apply overrides
    app.dependency_overrides[get_db().session] = override_session
    app.dependency_overrides[get_current_user] = override_current_user
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # Attach helper to client to switch users during test
            def set_current_user(user_key: str):
                nonlocal current_test_user
                current_test_user = test_users.get(user_key)
            ac.set_current_user = set_current_user
            yield ac
    finally:
        # Clear all overrides
        app.dependency_overrides.clear()


# Token fixtures imported from tests.fixtures.auth


@pytest.fixture
async def sample_exercise_with_category(db_session: AsyncSession):
    """Create exercise with category for testing items."""
    from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
    from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
    
    # Create category
    category = ExerciseCategoryModel(
        name="Pronunciation",
        slug="pronunciation",
        display_order=1,
    )
    db_session.add(category)
    await db_session.flush()
    
    # Create exercise
    exercise = ExerciseModel(
        category_id=category.id,
        code="PRON-001",
        title="Vowel Practice",
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
async def sample_item(db_session: AsyncSession, sample_exercise_with_category):
    """Create a sample exercise item."""
    from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
    
    item = ExerciseItemModel(
        exercise_id=sample_exercise_with_category.id,
        item_type="speech_practice",
        display_order=1,
        repetitions=5,
        item_metadata={"text": "Say 'ah'"},
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    
    return item


@pytest.fixture
async def sample_instruction(db_session: AsyncSession, sample_exercise_with_category):
    """Create a sample exercise instruction."""
    from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
    from datetime import datetime, timezone
    
    instruction = ExerciseInstructionsModel(
        exercise_id=sample_exercise_with_category.id,
        language="de",
        hint_text="This is a helpful hint",
        explanation_text="Detailed explanation of the exercise",
        safety_notes="Safety information",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(instruction)
    await db_session.commit()
    await db_session.refresh(instruction)
    
    return instruction


# ============================================================================
# POST /api/v1/exercises/items - Add Item to Exercise
# ============================================================================

class TestCreateItem:
    """Test item creation endpoint."""
    
    async def test_create_item_as_admin_success(self, client: AsyncClient, admin_token: str, sample_exercise_with_category):
        """Admin can add an item to an exercise."""
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "movement",
                "sort_order": 1,
                "content": {
                    "text": "Open your mouth wide",
                    "repetitions": 10,
                    "duration_seconds": 30,
                },
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["item_type"] == "movement"
        assert data["display_order"] == 1
        assert "id" in data
    
    async def test_create_item_as_therapist_success(self, client: AsyncClient, therapist_token: str, sample_exercise_with_category):
        """Therapist can add an item to an exercise."""
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "speech_practice",
                "sort_order": 2,
                "content": {
                    "text": "Say 'ee'",
                    "repetitions": 5,
                },
            },
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["item_type"] == "speech_practice"
    
    async def test_create_item_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_exercise_with_category):
        """Regular user cannot add an item."""
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "information",
                "sort_order": 1,
                "content": {"text": "Should fail"},
            },
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_create_item_exercise_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 when exercise doesn't exist."""
        fake_exercise_id = uuid4()
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(fake_exercise_id),
                "item_type": "movement",
                "sort_order": 1,
                "content": {},
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_create_item_invalid_type_validation_error(self, client: AsyncClient, admin_token: str, sample_exercise_with_category):
        """Invalid item type triggers validation error."""
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "invalid_type",  # Invalid!
                "sort_order": 1,
                "content": {},
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code in [400, 422]


# ============================================================================
# GET /api/v1/exercises/items - List Items
# ============================================================================

class TestListItems:
    """Test item listing endpoint."""
    
    async def test_list_items_for_exercise(self, client: AsyncClient, sample_item, sample_exercise_with_category):
        """Can list all items for an exercise."""
        response = await client.get(
            f"/api/v1/exercises/items?exercise_id={sample_exercise_with_category.id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our sample item
        item = next((i for i in data if i["id"] == str(sample_item.id)), None)
        assert item is not None
        assert item["item_type"] == "speech_practice"
    
    async def test_list_items_filter_by_type(self, client: AsyncClient, db_session: AsyncSession, sample_exercise_with_category):
        """Can filter items by type."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Create items of different types
        movement_item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=1,
        )
        speech_item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="speech_practice",
            display_order=2,
        )
        info_item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="information",
            display_order=3,
        )
        db_session.add_all([movement_item, speech_item, info_item])
        await db_session.commit()
        
        # Filter by movement type
        response = await client.get(
            f"/api/v1/exercises/items?exercise_id={sample_exercise_with_category.id}&item_type=movement"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All items should be movement type
        for item in data:
            assert item["item_type"] == "movement"
    
    async def test_list_items_filter_by_language(self, client: AsyncClient, db_session: AsyncSession, sample_exercise_with_category):
        """Can filter items by language."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        
        # Create item with multiple language contents
        item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="speech_practice",
            display_order=1,
        )
        db_session.add(item)
        await db_session.flush()
        
        # Add language-specific contents
        en_content = ExerciseItemContentModel(
            item_id=item.id,
            language="en",
            text_content="Say hello",
        )
        de_content = ExerciseItemContentModel(
            item_id=item.id,
            language="de",
            text_content="Sag hallo",
        )
        db_session.add_all([en_content, de_content])
        await db_session.commit()
        
        # Filter by German language
        response = await client.get(
            f"/api/v1/exercises/items?exercise_id={sample_exercise_with_category.id}&language=de"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
    
    async def test_list_items_exercise_not_found(self, client: AsyncClient):
        """Returns 404 when exercise doesn't exist."""
        fake_exercise_id = uuid4()
        response = await client.get(f"/api/v1/exercises/items?exercise_id={fake_exercise_id}")
        
        assert response.status_code == 404


# ============================================================================
# POST /api/v1/exercises/items/reorder - Reorder Items
# ============================================================================

class TestReorderItems:
    """Test item reordering endpoint."""
    
    async def test_reorder_items_as_admin_success(self, client: AsyncClient, admin_token: str, db_session: AsyncSession, sample_exercise_with_category):
        """Admin can reorder items."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Create multiple items
        item1 = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=1,
        )
        item2 = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=2,
        )
        item3 = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=3,
        )
        db_session.add_all([item1, item2, item3])
        await db_session.commit()
        
        # Reorder: swap item3 to first position
        response = await client.post(
            f"/api/v1/exercises/items/reorder?exercise_id={sample_exercise_with_category.id}",
            json={"item_ids": [str(item3.id), str(item1.id), str(item2.id)]},
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Reordered" in data["message"]
    
    async def test_reorder_items_as_therapist_success(self, client: AsyncClient, therapist_token: str, db_session: AsyncSession, sample_exercise_with_category):
        """Therapist can reorder items."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        item1 = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=1,
        )
        item2 = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=2,
        )
        db_session.add_all([item1, item2])
        await db_session.commit()
        
        response = await client.post(
            f"/api/v1/exercises/items/reorder?exercise_id={sample_exercise_with_category.id}",
            json={"item_ids": [str(item2.id), str(item1.id)]},
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 200
    
    async def test_reorder_items_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_exercise_with_category):
        """Regular user cannot reorder items."""
        response = await client.post(
            f"/api/v1/exercises/items/reorder?exercise_id={sample_exercise_with_category.id}",
            json={"item_ids": [str(uuid4())]},
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403


# ============================================================================
# DELETE /api/v1/exercises/items/{item_id} - Delete Item
# ============================================================================

class TestDeleteItem:
    """Test item deletion endpoint."""
    
    async def test_delete_item_as_admin_success(self, client: AsyncClient, admin_token: str, sample_item):
        """Admin can delete an item."""
        response = await client.delete(
            f"/api/v1/exercises/items/{sample_item.id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"].lower()
    
    async def test_delete_item_as_therapist_forbidden(self, client: AsyncClient, therapist_token: str, sample_item):
        """Therapist cannot delete an item (Admin only)."""
        response = await client.delete(
            f"/api/v1/exercises/items/{sample_item.id}",
            headers={"Authorization": therapist_token},
        )
        
        assert response.status_code == 403
    
    async def test_delete_item_as_regular_user_forbidden(self, client: AsyncClient, regular_user_token: str, sample_item):
        """Regular user cannot delete an item."""
        response = await client.delete(
            f"/api/v1/exercises/items/{sample_item.id}",
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_delete_item_not_found(self, client: AsyncClient, admin_token: str):
        """Returns 404 for non-existent item."""
        fake_id = uuid4()
        response = await client.delete(
            f"/api/v1/exercises/items/{fake_id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404


# ============================================================================
# Integration Scenarios
# ============================================================================

class TestItemIntegrationScenarios:
    """Test complete workflows involving items."""
    
    async def test_create_exercise_with_multiple_items(self, client: AsyncClient, admin_token: str, sample_exercise_with_category):
        """Can create multiple items for an exercise."""
        # Add movement item
        movement_response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "movement",
                "sort_order": 1,
                "content": {"text": "Stretch your tongue"},
            },
            headers={"Authorization": admin_token},
        )
        assert movement_response.status_code == 201
        
        # Add speech practice item
        speech_response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "speech_practice",
                "sort_order": 2,
                "content": {"text": "Say 'la la la'"},
            },
            headers={"Authorization": admin_token},
        )
        assert speech_response.status_code == 201
        
        # Add information item
        info_response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "information",
                "sort_order": 3,
                "content": {"text": "This helps with articulation"},
            },
            headers={"Authorization": admin_token},
        )
        assert info_response.status_code == 201
        
        # Verify all items are listed
        list_response = await client.get(
            f"/api/v1/exercises/items?exercise_id={sample_exercise_with_category.id}"
        )
        assert list_response.status_code == 200
        items = list_response.json()
        assert len(items) >= 3
    
    async def test_reorder_and_verify_order(self, client: AsyncClient, admin_token: str, db_session: AsyncSession, sample_exercise_with_category):
        """Items maintain order after reordering."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Create items in order
        items = []
        for i in range(1, 4):
            item = ExerciseItemModel(
                exercise_id=sample_exercise_with_category.id,
                item_type="movement",
                display_order=i,
                item_metadata={"order": i},
            )
            db_session.add(item)
            items.append(item)
        await db_session.commit()
        
        # Reverse order
        reversed_ids = [str(items[2].id), str(items[1].id), str(items[0].id)]
        reorder_response = await client.post(
            f"/api/v1/exercises/items/reorder?exercise_id={sample_exercise_with_category.id}",
            json={"item_ids": reversed_ids},
            headers={"Authorization": admin_token},
        )
        assert reorder_response.status_code == 200
        
        # Verify new order
        list_response = await client.get(
            f"/api/v1/exercises/items?exercise_id={sample_exercise_with_category.id}"
        )
        assert list_response.status_code == 200
        listed_items = list_response.json()
        
        # Items should be in reversed order (by display_order)
        sorted_items = sorted(listed_items, key=lambda x: x["display_order"])
        assert sorted_items[0]["id"] == str(items[2].id)
        assert sorted_items[1]["id"] == str(items[1].id)
        assert sorted_items[2]["id"] == str(items[0].id)


# ============================================================================
# Instruction-Item Association Tests
# ============================================================================

class TestItemInstructionAssociation:
    """Test instruction_id functionality in item endpoints."""
    
    async def test_create_item_with_instruction_id(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        sample_exercise_with_category,
        sample_instruction
    ):
        """Can create item with instruction_id."""
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "information",
                "sort_order": 1,
                "instruction_id": str(sample_instruction.id),
                "content": {
                    "text": "Stretch your jaw",
                },
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["instruction_id"] == str(sample_instruction.id)
        assert "instruction" in data
        assert data["instruction"] is not None
        assert data["instruction"]["id"] == str(sample_instruction.id)
        assert data["instruction"]["hint_text"] == sample_instruction.hint_text
    
    async def test_create_item_without_instruction_id(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        sample_exercise_with_category
    ):
        """Can create item without instruction_id."""
        response = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "speech_practice",
                "sort_order": 1,
                "content": {
                    "text": "Say 'ee'",
                    "phonetic_target": "i:",
                },
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["instruction_id"] is None
        assert data["instruction"] is None
    
    async def test_update_item_add_instruction_id(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        sample_item,
        sample_instruction
    ):
        """Can update item to add instruction_id."""
        response = await client.put(
            f"/api/v1/exercises/items/{sample_item.id}",
            json={
                "instruction_id": str(sample_instruction.id),
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["instruction_id"] == str(sample_instruction.id)
        assert data["instruction"] is not None
        assert data["instruction"]["id"] == str(sample_instruction.id)
    
    async def test_update_item_clear_instruction_id(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        db_session: AsyncSession,
        sample_exercise_with_category,
        sample_instruction
    ):
        """Can update item to clear instruction_id."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Create item with instruction
        item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=1,
            instruction_id=sample_instruction.id,
        )
        db_session.add(item)
        await db_session.commit()
        await db_session.refresh(item)
        
        # Clear instruction_id
        response = await client.put(
            f"/api/v1/exercises/items/{item.id}",
            json={
                "instruction_id": None,
            },
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["instruction_id"] is None
        assert data["instruction"] is None
    
    async def test_attach_instruction_to_item(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        sample_item,
        sample_instruction
    ):
        """Can attach instruction to item using dedicated endpoint."""
        response = await client.post(
            f"/api/v1/exercises/items/{sample_item.id}/instruction/{sample_instruction.id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["instruction_id"] == str(sample_instruction.id)
        assert data["instruction"] is not None
        assert data["instruction"]["hint_text"] == sample_instruction.hint_text
    
    async def test_attach_instruction_item_not_found(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        sample_instruction
    ):
        """Returns 404 when attaching instruction to non-existent item."""
        fake_item_id = uuid4()
        response = await client.post(
            f"/api/v1/exercises/items/{fake_item_id}/instruction/{sample_instruction.id}",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_detach_instruction_from_item(
        self, 
        client: AsyncClient, 
        admin_token: str, 
        db_session: AsyncSession,
        sample_exercise_with_category,
        sample_instruction
    ):
        """Can detach instruction from item using dedicated endpoint."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Create item with instruction
        item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="speech_practice",
            display_order=1,
            instruction_id=sample_instruction.id,
        )
        db_session.add(item)
        await db_session.commit()
        await db_session.refresh(item)
        
        # Detach instruction
        response = await client.delete(
            f"/api/v1/exercises/items/{item.id}/instruction",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["instruction_id"] is None
        assert data["instruction"] is None
    
    async def test_detach_instruction_item_not_found(
        self, 
        client: AsyncClient, 
        admin_token: str
    ):
        """Returns 404 when detaching instruction from non-existent item."""
        fake_item_id = uuid4()
        response = await client.delete(
            f"/api/v1/exercises/items/{fake_item_id}/instruction",
            headers={"Authorization": admin_token},
        )
        
        assert response.status_code == 404
    
    async def test_list_items_includes_instruction(
        self, 
        client: AsyncClient, 
        db_session: AsyncSession,
        sample_exercise_with_category,
        sample_instruction
    ):
        """List items endpoint includes instruction data."""
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Create item with instruction
        item = ExerciseItemModel(
            exercise_id=sample_exercise_with_category.id,
            item_type="movement",
            display_order=1,
            instruction_id=sample_instruction.id,
        )
        db_session.add(item)
        await db_session.commit()
        
        # List items
        response = await client.get(
            f"/api/v1/exercises/items?exercise_id={sample_exercise_with_category.id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find our item
        our_item = next((i for i in data if i["id"] == str(item.id)), None)
        assert our_item is not None
        assert our_item["instruction_id"] == str(sample_instruction.id)
        assert our_item["instruction"] is not None
        assert our_item["instruction"]["hint_text"] == sample_instruction.hint_text
    
    async def test_multiple_items_same_instruction(
        self, 
        client: AsyncClient, 
        admin_token: str,
        sample_exercise_with_category,
        sample_instruction
    ):
        """Multiple items can reference the same instruction."""
        # Create first item
        response1 = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "information",
                "sort_order": 1,
                "instruction_id": str(sample_instruction.id),
                "content": {
                    "text": "Stretch your jaw",
                },
            },
            headers={"Authorization": admin_token},
        )
        
        # Create second item with same instruction
        response2 = await client.post(
            "/api/v1/exercises/items",
            json={
                "exercise_id": str(sample_exercise_with_category.id),
                "item_type": "speech_practice",
                "sort_order": 2,
                "instruction_id": str(sample_instruction.id),
                "content": {
                    "text": "Say 'ah'",
                    "phonetic_target": "a:",
                },
            },
            headers={"Authorization": admin_token},
        )
        
        assert response1.status_code == 201
        assert response2.status_code == 201
        
        item1 = response1.json()
        item2 = response2.json()
        
        assert item1["instruction_id"] == str(sample_instruction.id)
        assert item2["instruction_id"] == str(sample_instruction.id)
        assert item1["instruction"]["hint_text"] == item2["instruction"]["hint_text"]
    
    async def test_attach_instruction_requires_auth(
        self, 
        client: AsyncClient, 
        sample_item,
        sample_instruction
    ):
        """Attaching instruction requires authentication."""
        # Clear auth override to test unauthorized access
        from src.api.dependencies import get_current_user
        app.dependency_overrides.pop(get_current_user, None)
        
        response = await client.post(
            f"/api/v1/exercises/items/{sample_item.id}/instruction/{sample_instruction.id}",
        )
        
        assert response.status_code == 401
    
    async def test_detach_instruction_requires_auth(
        self, 
        client: AsyncClient, 
        sample_item
    ):
        """Detaching instruction requires authentication."""
        # Clear auth override to test unauthorized access
        from src.api.dependencies import get_current_user
        app.dependency_overrides.pop(get_current_user, None)
        
        response = await client.delete(
            f"/api/v1/exercises/items/{sample_item.id}/instruction",
        )
        
        assert response.status_code == 401
    
    async def test_attach_instruction_regular_user_forbidden(
        self, 
        client: AsyncClient, 
        regular_user_token: str,
        sample_item,
        sample_instruction
    ):
        """Regular user cannot attach instruction."""
        # Set current user to regular user
        client.set_current_user("user")
        
        response = await client.post(
            f"/api/v1/exercises/items/{sample_item.id}/instruction/{sample_instruction.id}",
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
    
    async def test_detach_instruction_regular_user_forbidden(
        self, 
        client: AsyncClient, 
        regular_user_token: str,
        sample_item
    ):
        """Regular user cannot detach instruction."""
        # Set current user to regular user
        client.set_current_user("user")
        
        response = await client.delete(
            f"/api/v1/exercises/items/{sample_item.id}/instruction",
            headers={"Authorization": regular_user_token},
        )
        
        assert response.status_code == 403
