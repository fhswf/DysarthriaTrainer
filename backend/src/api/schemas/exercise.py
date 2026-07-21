"""
Pydantic schemas for exercise-related API requests and responses.

These schemas define the data transfer objects (DTOs) for the Exercise domain,
providing request validation and response serialization for the REST API.

Schema Categories:
1. Exercise Category schemas (CRUD + reorder)
2. Exercise schemas (CRUD + versioning + relationships)
3. Exercise Item schemas (CRUD + polymorphic content)
4. Common response schemas (pagination, messages)
"""

from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)


# ============================================================================
# Exercise Category Schemas
# ============================================================================


class ExerciseCategoryCreate(BaseModel):
    """Request schema for creating an exercise category."""

    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    slug: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    description: str | None = None
    display_order: int = 0

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Lippen-Training",
                    "slug": "lippen-training",
                    "description": "Übungen zur Stärkung der Lippenmuskulatur",
                    "display_order": 1,
                }
            ]
        }
    )


class ExerciseCategoryUpdate(BaseModel):
    """Request schema for updating an exercise category."""

    name: Annotated[str, StringConstraints(min_length=1, max_length=100)] | None = None
    slug: Annotated[str, StringConstraints(min_length=1, max_length=50)] | None = None
    description: str | None = None
    display_order: int | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Lippen-Training Fortgeschritten",
                    "description": "Erweiterte Übungen für die Lippenmuskulatur",
                }
            ]
        }
    )


class ExerciseCategoryResponse(BaseModel):
    """Response schema for an exercise category."""

    id: UUID
    name: str
    slug: str
    description: str | None
    display_order: int
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ExerciseCategoryReorder(BaseModel):
    """Request schema for reordering categories."""

    category_ids: list[UUID] = Field(
        ..., description="List of category IDs in desired order"
    )

    @field_validator("category_ids")
    @classmethod
    def validate_category_ids(cls, v: list[UUID]) -> list[UUID]:
        """Ensure at least one category ID is provided."""
        if not v:
            raise ValueError("At least one category ID must be provided")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "category_ids": [
                        "123e4567-e89b-12d3-a456-426614174000",
                        "223e4567-e89b-12d3-a456-426614174001",
                    ]
                }
            ]
        }
    )


# ============================================================================
# Exercise Schemas
# ============================================================================


class ExerciseCreate(BaseModel):
    """Request schema for creating an exercise."""

    category_id: UUID
    code: Annotated[str, StringConstraints(min_length=1, max_length=20)]
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    subtitle: str | None = None
    scope: str | None = None
    difficulty_level: Annotated[
        str, StringConstraints(pattern=r"^(beginner|intermediate|advanced)$")
    ]
    estimated_duration_minutes: int | None = Field(None, ge=1, le=180)
    instructions: list["ExerciseInstructionsCreate"] = Field(default_factory=list)
    items: list["ExerciseItemCreateRequest"] = Field(default_factory=list)
    is_active: bool = True
    display_order: int = 0

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "category_id": "123e4567-e89b-12d3-a456-426614174000",
                    "code": "PRON_001",
                    "title": "Vowel Pronunciation Practice",
                    "subtitle": "German vowel sounds /aː/, /ɛ/, /iː/",
                    "scope": "Practice pronunciation of common German vowel sounds with minimal pairs",
                    "difficulty_level": "beginner",
                    "estimated_duration_minutes": 15,
                    "instructions": [
                        {
                            "language": "de",
                            "hint_text": "Achten Sie auf die Zungenposition beim Sprechen",
                            "explanation_text": "Diese Übung hilft Ihnen, deutsche Vokale korrekt auszusprechen",
                            "preparation_text": "Entspannen Sie Ihre Gesichtsmuskeln vor Beginn",
                            "display_order": 1
                        },
                        {
                            "language": "en",
                            "hint_text": "Pay attention to tongue position while speaking",
                            "explanation_text": "This exercise helps you pronounce German vowels correctly",
                            "preparation_text": "Relax your facial muscles before starting",
                            "display_order": 1
                        }
                    ],
                    "items": [],
                    "is_active": True,
                    "display_order": 1
                }
            ]
        }
    )


class ExerciseUpdate(BaseModel):
    """Request schema for updating an exercise."""

    title: Annotated[str, StringConstraints(min_length=1, max_length=200)] | None = None
    subtitle: str | None = None
    scope: str | None = None
    difficulty_level: Annotated[
        str, StringConstraints(pattern=r"^(beginner|intermediate|advanced)$")
    ] | None = None
    estimated_duration_minutes: int | None = Field(None, ge=1, le=180)
    instructions: list["ExerciseInstructionsCreate"] | None = None
    items: list["ExerciseItemCreateRequest"] | None = None
    is_active: bool | None = None
    display_order: int | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "Lippen zusammenpressen - Verbessert",
                    "scope": "Überarbeitete Version der Übung",
                    "difficulty_level": "intermediate",
                    "items": [
                        {
                            "item_type": "movement",
                            "display_order": 1,
                            "repetitions": 5,
                            "duration_seconds": 10,
                            "metadata": {"instruction": "Öffnen Sie den Mund sehr weit"}
                        }
                    ],
                }
            ]
        }
    )


class ExerciseVersionCreate(BaseModel):
    """Request schema for creating a new version of an exercise."""

    title: Annotated[str, StringConstraints(min_length=1, max_length=200)] | None = None
    subtitle: str | None = None
    scope: str | None = None
    difficulty_level: Annotated[
        str, StringConstraints(pattern=r"^(beginner|intermediate|advanced)$")
    ] | None = None
    estimated_duration_minutes: int | None = Field(None, ge=1, le=180)
    instructions: list[str] | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "Lippen zusammenpressen V2",
                    "scope": "Verbesserte Version mit neuen Techniken",
                    "difficulty_level": "intermediate",
                }
            ]
        }
    )


class ExerciseResponse(BaseModel):
    """Response schema for an exercise (basic without relationships)."""

    id: UUID
    category_id: UUID
    code: str
    title: str
    subtitle: str | None
    scope: str | None
    difficulty_level: str
    estimated_duration_minutes: int | None
    display_order: int
    version: int
    is_active: bool
    superseded_by: UUID | None
    created_at: datetime
    updated_at: datetime | None
    deleted_at: datetime | None
    created_by: str | None
    deleted_by: UUID | None

    model_config = ConfigDict(from_attributes=True)


class ExerciseDetailResponse(ExerciseResponse):
    """Response schema for exercise with full details including relationships."""

    instructions: list["ExerciseInstructionsResponse"] = Field(default_factory=list)
    category: ExerciseCategoryResponse | None = None
    items: list["ExerciseItemResponse"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ExerciseListResponse(BaseModel):
    """Response schema for paginated list of exercises."""

    exercises: list[ExerciseResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool


# ============================================================================
# Exercise Instructions Schemas
# ============================================================================


class ExerciseInstructionsCreate(BaseModel):
    """Request schema for creating exercise instructions."""

    language: Annotated[str, StringConstraints(min_length=2, max_length=10)] = "de"
    hint_text: str | None = None
    explanation_text: str | None = None
    safety_notes: str | None = None
    audio_instruction_url: str | None = None
    image_url: str | None = None
    display_order: int = 0

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "language": "de",
                    "hint_text": "Achten Sie auf eine aufrechte Haltung",
                    "explanation_text": "Diese Übung verbessert die Artikulation",
                    "safety_notes": "Bei Schmerzen sofort abbrechen",
                    "audio_instruction_url": "https://example.com/audio/instruction_de.mp3",
                    "image_url": "https://example.com/images/instruction.jpg",
                    "display_order": 0,
                }
            ]
        }
    )


class ExerciseInstructionsUpdate(BaseModel):
    """Request schema for updating exercise instructions."""

    hint_text: str | None = None
    explanation_text: str | None = None
    safety_notes: str | None = None
    audio_instruction_url: str | None = None
    image_url: str | None = None
    display_order: int | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "hint_text": "Aktualisierter Hinweis",
                    "safety_notes": "Neue Sicherheitshinweise",
                }
            ]
        }
    )


class ExerciseInstructionsResponse(BaseModel):
    """Response schema for exercise instructions."""

    id: UUID
    exercise_id: UUID
    language: str
    hint_text: str | None
    explanation_text: str | None
    safety_notes: str | None
    audio_instruction_url: str | None
    image_url: str | None
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Exercise Item Schemas
# ============================================================================


class ExerciseItemCreateRequest(BaseModel):
    """Request schema for creating an exercise item (from frontend form)."""

    item_type: Annotated[
        str,
        StringConstraints(pattern=r"^(minimal_pair|word|sentence|breathing|vocalization|articulation|rhythm|intonation|movement|speech_practice|information)$"),
    ]
    display_order: int = 0
    instruction_id: UUID | None = None
    repetitions: int | None = None
    duration_seconds: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict, description="Item-specific content as JSON")
    contents: list["ExerciseItemContentCreate"] = Field(default_factory=list, description="Language-specific contents")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "item_type": "movement",
                    "display_order": 1,
                    "instruction_id": "123e4567-e89b-12d3-a456-426614174003",
                    "repetitions": 3,
                    "duration_seconds": 5,
                    "metadata": {
                        "instruction": "Öffnen Sie den Mund weit",
                        "media_file_id": "223e4567-e89b-12d3-a456-426614174001",
                    },
                },
            ]
        }
    )


class ExerciseItemCreate(BaseModel):
    """Request schema for creating an exercise item."""

    exercise_id: UUID
    item_type: Annotated[
        str,
        StringConstraints(pattern=r"^(movement|speech_practice|information)$"),
    ]
    display_order: int = 0
    instruction_id: UUID | None = None
    language: Annotated[str, StringConstraints(min_length=2, max_length=5)] = "de"
    content: dict[str, Any] = Field(..., description="Item-specific content as JSON")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: dict[str, Any], info) -> dict[str, Any]:
        """Validate content structure based on item type."""
        item_type = info.data.get("item_type")

        # Basic validation - ensure content is not empty
        if not v:
            raise ValueError("Content cannot be empty")

        # Type-specific validation
        if item_type == "movement":
            required_fields = {"instruction", "media_file_id"}
            if not required_fields.issubset(v.keys()):
                raise ValueError(
                    f"Movement items require fields: {required_fields}"
                )

        elif item_type == "speech_practice":
            required_fields = {"text", "phonetic_target"}
            if not required_fields.issubset(v.keys()):
                raise ValueError(
                    f"Speech practice items require fields: {required_fields}"
                )

        elif item_type == "information":
            if "text" not in v:
                raise ValueError("Information items require 'text' field")

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "exercise_id": "123e4567-e89b-12d3-a456-426614174000",
                    "item_type": "movement",
                    "sort_order": 1,
                    "language": "de",
                    "content": {
                        "instruction": "Öffnen Sie den Mund weit",
                        "duration_seconds": 5,
                        "repetitions": 3,
                        "media_file_id": "223e4567-e89b-12d3-a456-426614174001",
                    },
                },
                {
                    "exercise_id": "123e4567-e89b-12d3-a456-426614174000",
                    "item_type": "speech_practice",
                    "sort_order": 2,
                    "language": "de",
                    "content": {
                        "text": "Papa",
                        "phonetic_target": "/p/",
                        "difficulty": "easy",
                        "audio_file_id": "323e4567-e89b-12d3-a456-426614174002",
                    },
                },
            ]
        }
    )


class ExerciseItemUpdate(BaseModel):
    """Request schema for updating an exercise item."""

    item_type: Annotated[
        str,
        StringConstraints(pattern=r"^(movement|speech_practice|information)$"),
    ] | None = None
    instruction_id: UUID | None = None
    display_order: int | None = None
    language: Annotated[str, StringConstraints(min_length=2, max_length=5)] | None = None
    content: dict[str, Any] | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "display_order": 3,
                    "content": {
                        "instruction": "Öffnen Sie den Mund sehr weit",
                        "repetitions": 5,
                    },
                }
            ]
        }
    )


class ExerciseItemResponse(BaseModel):
    """Response schema for an exercise item."""

    id: UUID
    exercise_id: UUID | None  # None for library items
    is_library_item: bool = False
    item_type: str
    instruction_id: UUID | None = None
    instruction: "ExerciseInstructionsResponse | None" = None
    display_order: int
    repetitions: int | None = None
    duration_seconds: int | None = None
    metadata: dict[str, Any] | None = None
    contents: list["ExerciseItemContentResponse"] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExerciseItemReorder(BaseModel):
    """Request schema for reordering exercise items."""

    item_ids: list[UUID] = Field(..., description="List of item IDs in desired order")

    @field_validator("item_ids")
    @classmethod
    def validate_item_ids(cls, v: list[UUID]) -> list[UUID]:
        """Ensure at least one item ID is provided."""
        if not v:
            raise ValueError("At least one item ID must be provided")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "item_ids": [
                        "323e4567-e89b-12d3-a456-426614174002",
                        "423e4567-e89b-12d3-a456-426614174003",
                    ]
                }
            ]
        }
    )


# ============================================================================
# Library Item Schemas
# ============================================================================


class ExerciseItemLibraryCreate(BaseModel):
    """Request schema for creating a standalone library item."""

    item_type: Annotated[
        str,
        StringConstraints(pattern=r"^(minimal_pair|word|sentence|breathing|vocalization|articulation|rhythm|intonation|movement|speech_practice|information)$"),
    ]
    instruction_id: UUID | None = None
    repetitions: int | None = None
    duration_seconds: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict, description="Item-specific metadata")
    contents: list["ExerciseItemContentCreate"] = Field(
        ..., 
        min_length=1,
        description="Language-specific contents (at least one required)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "item_type": "movement",
                    "instruction_id": "123e4567-e89b-12d3-a456-426614174003",
                    "repetitions": 3,
                    "duration_seconds": 5,
                    "metadata": {
                        "difficulty": "medium",
                        "tags": ["opening", "lips"]
                    },
                    "contents": [
                        {
                            "language": "de",
                            "title": "Mund öffnen",
                            "description": "Öffnen Sie den Mund weit",
                            "media_file_id": "223e4567-e89b-12d3-a456-426614174001"
                        }
                    ]
                }
            ]
        }
    )


class ExerciseItemLibraryUpdate(BaseModel):
    """Request schema for updating a library item."""

    item_type: Annotated[
        str,
        StringConstraints(pattern=r"^(minimal_pair|word|sentence|breathing|vocalization|articulation|rhythm|intonation|movement|speech_practice|information)$"),
    ] | None = None
    instruction_id: UUID | None = None
    repetitions: int | None = None
    duration_seconds: int | None = None
    metadata: dict[str, Any] | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "repetitions": 5,
                    "metadata": {"difficulty": "hard"}
                }
            ]
        }
    )


class LibraryItemsListResponse(BaseModel):
    """Response schema for paginated library items list."""

    items: list["ExerciseItemResponse"]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)


class AttachLibraryItemRequest(BaseModel):
    """Request schema for attaching a library item to an exercise."""

    exercise_id: UUID = Field(..., description="ID of the exercise to attach to")
    display_order: int | None = Field(None, description="Display order in exercise (defaults to last)")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "exercise_id": "123e4567-e89b-12d3-a456-426614174000",
                    "display_order": 5
                }
            ]
        }
    )


class DuplicateItemRequest(BaseModel):
    """Request schema for duplicating an item."""

    as_library_item: bool = Field(
        False, 
        description="If true, creates duplicate as library item; otherwise as regular item"
    )
    exercise_id: UUID | None = Field(
        None,
        description="Required if as_library_item=False; target exercise for duplicate"
    )

    @model_validator(mode="after")
    def validate_exercise_id_required(self) -> "DuplicateItemRequest":
        """Ensure exercise_id is provided when not creating library item."""
        if not self.as_library_item and self.exercise_id is None:
            raise ValueError("exercise_id is required when as_library_item=False")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "as_library_item": True
                },
                {
                    "as_library_item": False,
                    "exercise_id": "123e4567-e89b-12d3-a456-426614174000"
                }
            ]
        }
    )


class ExerciseFromItemsCreate(BaseModel):
    """Request schema for creating an exercise from library items."""

    code: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    name: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    category_id: UUID
    description: str | None = None
    difficulty: Annotated[
        str,
        StringConstraints(pattern=r"^(very_easy|easy|medium|hard|very_hard)$"),
    ] = "medium"
    library_item_ids: list[UUID] = Field(
        ...,
        min_length=1,
        description="List of library item IDs to include in exercise"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "code": "EX-001",
                    "name": "Lip Strengthening Basics",
                    "category_id": "423e4567-e89b-12d3-a456-426614174004",
                    "description": "Basic exercises for lip muscle strength",
                    "difficulty": "easy",
                    "library_item_ids": [
                        "523e4567-e89b-12d3-a456-426614174005",
                        "623e4567-e89b-12d3-a456-426614174006"
                    ]
                }
            ]
        }
    )


# ============================================================================
# Exercise Item Content Schemas
# ============================================================================


class ExerciseItemContentCreate(BaseModel):
    """Request schema for creating exercise item content (language-specific)."""

    language: Annotated[str, StringConstraints(min_length=2, max_length=10)] = "de"
    text_content: str | None = None
    
    # Movement-specific fields
    demonstration_video_url: str | None = None
    image_url: str | None = None
    
    # Speech practice-specific fields
    phonetic_transcription: str | None = None
    audio_example_url: str | None = None
    difficulty: str | None = None
    
    # Information-specific fields
    info_type: Annotated[
        str | None,
        StringConstraints(pattern=r"^(context|safety|tip|explanation)$"),
    ] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "language": "de",
                    "text_content": "Bahn - Bann",
                    "audio_file_url": "/audio/bahn_bann.mp3",
                    "demonstration_video_url": "/videos/bahn_demo.mp4",
                    "phonetic_transcription": "/baːn/ - /ban/",
                    "visual_cue_image_url": "/images/mouth_position_aa.png",
                    "difficulty_notes": "Focus on vowel length distinction between long /aː/ and short /a/"
                },
                {
                    "language": "en",
                    "text_content": "Track - Ban (German pronunciation)",
                    "audio_file_url": "/audio/bahn_bann_en.mp3",
                    "phonetic_transcription": "/baːn/ - /ban/",
                    "difficulty_notes": "Pay attention to the long 'a' sound in German"
                },
            ]
        }
    )


class ExerciseItemContentUpdate(BaseModel):
    """Request schema for updating exercise item content."""

    text_content: str | None = None
    demonstration_video_url: str | None = None
    image_url: str | None = None
    phonetic_transcription: str | None = None
    audio_example_url: str | None = None
    difficulty: str | None = None
    info_type: Annotated[
        str | None,
        StringConstraints(pattern=r"^(context|safety|tip|explanation)$"),
    ] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "text_content": "Aktualisierter Text",
                    "demonstration_video_url": "https://example.com/new_video.mp4",
                }
            ]
        }
    )


class ExerciseItemContentResponse(BaseModel):
    """Response schema for exercise item content."""

    id: UUID
    item_id: UUID
    language: str
    text_content: str | None
    demonstration_video_url: str | None
    image_url: str | None
    phonetic_transcription: str | None
    audio_example_url: str | None
    difficulty: str | None
    info_type: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Common Response Schemas
# ============================================================================


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str

    model_config = ConfigDict(
        json_schema_extra={"examples": [{"message": "Operation successful"}]}
    )


class ErrorResponse(BaseModel):
    """Generic error response."""

    error: str
    detail: str | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "error": "Validation Error",
                    "detail": "Invalid difficulty level provided",
                }
            ]
        }
    )


# Update forward references for nested models
ExerciseDetailResponse.model_rebuild()
ExerciseItemResponse.model_rebuild()
