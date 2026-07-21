"""
Unit tests for exercise domain entities.

Tests the exercise-related domain entities to ensure:
- Proper initialization with required fields
- Validation logic
- Entity behavior
- Type safety
"""

from datetime import datetime, timezone
from uuid import uuid4

from src.core.entities.exercise_category import ExerciseCategory
from src.core.entities.exercise import Exercise
from src.core.entities.exercise_item import ExerciseItem
from src.core.entities.media_file import MediaFile
from src.core.enums.exercise_enums import (
    DifficultyLevel,
    ExerciseItemType,
    MediaFileType,
)


class TestExerciseCategory:
    """Test ExerciseCategory entity."""
    
    def test_create_category_with_required_fields(self):
        """Test creating a category with only required fields."""
        category_id = uuid4()
        now = datetime.now(timezone.utc)
        
        category = ExerciseCategory(
            id=category_id,
            name="Lippen-Training",
            slug="lippen-training",
            description=None,
            icon_url=None,
            display_order=0,
            created_at=now,
            updated_at=now,
        )
        
        assert category.id == category_id
        assert category.name == "Lippen-Training"
        assert category.slug == "lippen-training"
        assert category.description is None
        assert category.icon_url is None
        assert category.display_order == 0
        assert category.deleted_at is None
        assert category.deleted_by is None
    
    def test_create_category_with_all_fields(self):
        """Test creating a category with all optional fields."""
        category_id = uuid4()
        deleted_by_id = uuid4()
        now = datetime.now(timezone.utc)
        
        category = ExerciseCategory(
            id=category_id,
            name="Lippen-Training",
            slug="lippen-training",
            description="Übungen für die Lippenmuskulatur",
            icon_url="https://example.com/icon.png",
            display_order=5,
            created_at=now,
            updated_at=now,
            deleted_at=now,
            deleted_by=deleted_by_id,
        )
        
        assert category.description == "Übungen für die Lippenmuskulatur"
        assert category.icon_url == "https://example.com/icon.png"
        assert category.display_order == 5
        assert category.deleted_at == now
        assert category.deleted_by == deleted_by_id
    
    def test_category_slug_lowercase(self):
        """Test that slug is typically lowercase."""
        category = ExerciseCategory(
            id=uuid4(),
            name="Lippen-Training",
            slug="lippen-training",
            description=None,
            icon_url=None,
            display_order=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        assert category.slug == category.slug.lower()


class TestExercise:
    """Test Exercise entity."""
    
    def test_create_exercise_with_required_fields(self):
        """Test creating an exercise with required fields."""
        exercise_id = uuid4()
        category_id = uuid4()
        now = datetime.now(timezone.utc)
        
        exercise = Exercise(
            id=exercise_id,
            category_id=category_id,
            code="LT001",
            title="Lippen zusammenpressen",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=None,
            display_order=0,
            version=1,
            is_active=True,
            superseded_by=None,
            created_at=now,
            updated_at=now,
            created_by=None,
            deleted_at=None,
            deleted_by=None,
        )
        
        assert exercise.id == exercise_id
        assert exercise.category_id == category_id
        assert exercise.code == "LT001"
        assert exercise.title == "Lippen zusammenpressen"
        assert exercise.difficulty_level == DifficultyLevel.BEGINNER
        assert exercise.version == 1
        assert exercise.is_active is True
        assert exercise.superseded_by is None
    
    def test_create_exercise_with_versioning(self):
        """Test exercise with version and superseded_by fields."""
        old_exercise_id = uuid4()
        new_exercise_id = uuid4()
        created_by_id = str(uuid4())
        
        old_exercise = Exercise(
            id=old_exercise_id,
            category_id=uuid4(),
            code="LT001",
            title="Lippen zusammenpressen",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
            display_order=0,
            version=1,
            is_active=False,  # Old version marked inactive
            superseded_by=new_exercise_id,  # Points to new version
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=created_by_id,
            deleted_at=None,
            deleted_by=None,
        )
        
        new_exercise = Exercise(
            id=new_exercise_id,
            category_id=old_exercise.category_id,
            code="LT001",  # Same code
            title="Lippen zusammenpressen - Verbessert",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.INTERMEDIATE,  # Changed difficulty
            estimated_duration_minutes=5,
            display_order=0,
            version=2,  # Incremented version
            is_active=True,  # New version is active
            superseded_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=created_by_id,
            deleted_at=None,
            deleted_by=None,
        )
        
        # Verify versioning relationship
        assert old_exercise.code == new_exercise.code
        assert old_exercise.version < new_exercise.version
        assert old_exercise.is_active is False
        assert new_exercise.is_active is True
        assert old_exercise.superseded_by == new_exercise.id
        assert new_exercise.superseded_by is None
    
    def test_exercise_difficulty_levels(self):
        """Test valid difficulty levels."""
        valid_levels = [
            (DifficultyLevel.BEGINNER, "beginner"),
            (DifficultyLevel.INTERMEDIATE, "intermediate"),
            (DifficultyLevel.ADVANCED, "advanced"),
        ]
        
        for level_enum, level_name in valid_levels:
            exercise = Exercise(
                id=uuid4(),
                category_id=uuid4(),
                code=f"EX{level_name[0].upper()}001",
                title=f"Exercise {level_name}",
                subtitle=None,
                scope=None,
                difficulty_level=level_enum,
                estimated_duration_minutes=5,
                display_order=0,
                version=1,
                is_active=True,
                superseded_by=None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                created_by=None,
                deleted_at=None,
                deleted_by=None,
            )
            assert exercise.difficulty_level == level_enum


class TestExerciseItem:
    """Test ExerciseItem entity."""
    
    def test_create_movement_item(self):
        """Test creating a movement type item."""
        item_id = uuid4()
        exercise_id = uuid4()
        now = datetime.now(timezone.utc)
        
        metadata = {
            "instruction": "Öffnen Sie den Mund weit",
            "duration_seconds": 5,
            "repetitions": 3,
            "media_file_id": str(uuid4()),
        }
        
        item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=1,
            repetitions=3,
            duration_seconds=5,
            metadata=metadata,
            created_at=now,
            updated_at=now,
        )
        
        assert item.id == item_id
        assert item.exercise_id == exercise_id
        assert item.item_type == ExerciseItemType.MOVEMENT
        assert item.display_order == 1
        assert item.repetitions == 3
        assert item.duration_seconds == 5
        assert item.metadata == metadata
    
    def test_create_speech_practice_item(self):
        """Test creating a speech practice type item."""
        metadata = {
            "text": "Papa",
            "phonetic_target": "/p/",
            "difficulty": "easy",
            "audio_file_id": str(uuid4()),
        }
        
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=uuid4(),
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=2,
            repetitions=None,
            duration_seconds=None,
            metadata=metadata,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        assert item.item_type == ExerciseItemType.SPEECH_PRACTICE
        assert item.metadata is not None
        assert item.metadata["text"] == "Papa"
        assert item.metadata["phonetic_target"] == "/p/"
    
    def test_create_information_item(self):
        """Test creating an information type item."""
        metadata = {
            "text": "Wichtig: Üben Sie nicht bei Schmerzen",
            "type": "safety",
        }
        
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=uuid4(),
            item_type=ExerciseItemType.INFORMATION,
            display_order=0,
            repetitions=None,
            duration_seconds=None,
            metadata=metadata,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        assert item.item_type == ExerciseItemType.INFORMATION
        assert item.metadata is not None
        assert item.metadata["type"] == "safety"
    
    def test_item_ordering(self):
        """Test that items can be ordered."""
        items = []
        exercise_id = uuid4()
        
        for i in range(3):
            item = ExerciseItem(
                id=uuid4(),
                exercise_id=exercise_id,
                item_type=ExerciseItemType.MOVEMENT,
                display_order=i,
                repetitions=None,
                duration_seconds=None,
                metadata={},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            items.append(item)
        
        # Verify ordering
        for i, item in enumerate(items):
            assert item.display_order == i


class TestMediaFile:
    """Test MediaFile entity."""
    
    def test_create_image_file(self):
        """Test creating an image media file."""
        file_id = uuid4()
        created_by_id = uuid4()
        now = datetime.now(timezone.utc)
        
        media = MediaFile(
            id=file_id,
            file_type=MediaFileType.IMAGE,
            mime_type="image/jpeg",
            file_size_bytes=524288,  # 512 KB
            original_filename="lip_exercise.jpg",
            storage_path="images/2025/11/abc123.jpg",
            cdn_url="https://cdn.example.com/images/2025/11/abc123.jpg",
            thumbnail_url="https://cdn.example.com/images/2025/11/abc123_thumb.jpg",
            duration_seconds=None,
            created_at=now,
            created_by=created_by_id,
        )
        
        assert media.id == file_id
        assert media.file_type == MediaFileType.IMAGE
        assert media.mime_type == "image/jpeg"
        assert media.file_size_bytes == 524288
        assert media.duration_seconds is None
    
    def test_create_audio_file(self):
        """Test creating an audio media file."""
        media = MediaFile(
            id=uuid4(),
            file_type=MediaFileType.AUDIO,
            mime_type="audio/mpeg",
            file_size_bytes=2097152,  # 2 MB
            original_filename="pronunciation.mp3",
            storage_path="audio/2025/11/def456.mp3",
            cdn_url="https://cdn.example.com/audio/2025/11/def456.mp3",
            thumbnail_url=None,
            duration_seconds=12,
            created_at=datetime.now(timezone.utc),
            created_by=uuid4(),
        )
        
        assert media.file_type == MediaFileType.AUDIO
        assert media.duration_seconds == 12
        assert media.thumbnail_url is None
    
    def test_create_video_file(self):
        """Test creating a video media file."""
        media = MediaFile(
            id=uuid4(),
            file_type=MediaFileType.VIDEO,
            mime_type="video/mp4",
            file_size_bytes=10485760,  # 10 MB
            original_filename="exercise_demo.mp4",
            storage_path="videos/2025/11/ghi789.mp4",
            cdn_url="https://cdn.example.com/videos/2025/11/ghi789.mp4",
            thumbnail_url="https://cdn.example.com/videos/2025/11/ghi789_thumb.jpg",
            duration_seconds=45,
            created_at=datetime.now(timezone.utc),
            created_by=uuid4(),
        )
        
        assert media.file_type == MediaFileType.VIDEO
        assert media.duration_seconds == 45
        assert media.thumbnail_url is not None
    
    def test_media_file_size_validation(self):
        """Test that file sizes are positive integers."""
        valid_sizes = [1024, 1048576, 10485760]
        
        for size in valid_sizes:
            media = MediaFile(
                id=uuid4(),
                file_type=MediaFileType.IMAGE,
                mime_type="image/png",
                file_size_bytes=size,
                original_filename="test.png",
                storage_path="images/test.png",
                cdn_url=None,
                thumbnail_url=None,
                duration_seconds=None,
                created_at=datetime.now(timezone.utc),
                created_by=None,
            )
            assert media.file_size_bytes > 0
