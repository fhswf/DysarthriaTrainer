"""Exercise-related exceptions."""

from uuid import UUID
from src.core.exceptions.base import DomainError
from src.core.exceptions.entity_not_found import NotFoundError


class ExerciseNotFoundError(NotFoundError):
    """Raised when an exercise is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: Exercise ID or code
        """
        super().__init__("Exercise", identifier)


class ExerciseCategoryNotFoundError(NotFoundError):
    """Raised when an exercise category is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: Category ID or slug
        """
        super().__init__("ExerciseCategory", identifier)


class ExerciseItemNotFoundError(NotFoundError):
    """Raised when an exercise item is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: Exercise item ID
        """
        super().__init__("ExerciseItem", identifier)


class MediaFileNotFoundError(NotFoundError):
    """Raised when a media file is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: Media file ID
        """
        super().__init__("MediaFile", identifier)


class InvalidExerciseTypeError(DomainError):
    """Raised when an invalid exercise type is provided."""
    
    def __init__(self, exercise_type: str, valid_types: list[str] | None = None):
        """
        Args:
            exercise_type: The invalid type that was provided
            valid_types: List of valid exercise types
        """
        self.exercise_type = exercise_type
        self.valid_types = valid_types
        
        if valid_types:
            message = f"Invalid exercise type '{exercise_type}'. Valid types are: {', '.join(valid_types)}"
        else:
            message = f"Invalid exercise type '{exercise_type}'"
        
        super().__init__(message)


class InvalidMediaFileTypeError(DomainError):
    """Raised when an invalid media file type is provided."""
    
    def __init__(self, file_type: str, allowed_types: list[str] | None = None):
        """
        Args:
            file_type: The invalid file type that was provided
            allowed_types: List of allowed file types
        """
        self.file_type = file_type
        self.allowed_types = allowed_types
        
        if allowed_types:
            message = f"Invalid file type '{file_type}'. Allowed types are: {', '.join(allowed_types)}"
        else:
            message = f"Invalid file type '{file_type}'"
        
        super().__init__(message)


class ExerciseVersionConflictError(DomainError):
    """Raised when there's a conflict with exercise versioning."""
    
    def __init__(self, exercise_code: str, version: int, message: str | None = None):
        """
        Args:
            exercise_code: The code of the exercise
            version: The version that caused the conflict
            message: Optional custom message
        """
        self.exercise_code = exercise_code
        self.version = version
        
        if not message:
            message = f"Version conflict for exercise '{exercise_code}' version {version}"
        
        super().__init__(message)


class MediaFileValidationError(DomainError):
    """Raised when media file validation fails."""
    
    def __init__(self, filename: str, reason: str):
        """
        Args:
            filename: Name of the file that failed validation
            reason: Reason for validation failure
        """
        self.filename = filename
        self.reason = reason
        message = f"Media file '{filename}' validation failed: {reason}"
        super().__init__(message)


class StorageError(DomainError):
    """Raised when storage operation fails."""
    
    def __init__(self, message: str):
        """
        Args:
            message: Description of the storage error
        """
        super().__init__(f"Storage error: {message}")
