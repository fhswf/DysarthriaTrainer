"""
API schemas for requests and responses.
"""

from src.api.schemas.common import (
    PaginatedResponse,
    MessageResponse,
    ErrorResponse,
)

from src.api.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    EmailVerificationRequest,
    TokenResponse,
    UserResponse,
    LoginResponse,
    MessageResponse,
    ErrorResponse,
)

from src.api.schemas.rbac import (
    RoleCreateRequest,
    RoleUpdateRequest,
    AssignRoleRequest,
    PermissionCreateRequest,
    PermissionUpdateRequest,
    AddPermissionToRoleRequest,
    PermissionResponse,
    RoleResponse,
    UserPermissionsResponse,
)

from src.api.schemas.exercise import (
    ExerciseCategoryCreate,
    ExerciseCategoryUpdate,
    ExerciseCategoryResponse,
    ExerciseCategoryReorder,
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseVersionCreate,
    ExerciseResponse,
    ExerciseDetailResponse,
    ExerciseListResponse,
    ExerciseItemCreate,
    ExerciseItemUpdate,
    ExerciseItemResponse,
    ExerciseItemReorder,
    ExerciseItemLibraryCreate,
    ExerciseItemLibraryUpdate,
    LibraryItemsListResponse,
    AttachLibraryItemRequest,
    DuplicateItemRequest,
    ExerciseFromItemsCreate,
)

from src.api.schemas.media import (
    MediaFileUpload,
    MediaFileResponse,
    MediaFileDetailResponse,
    MediaFileListResponse,
    MediaFileSearchRequest,
    StorageStatsResponse,
    BulkDeleteRequest,
    BulkDeleteResponse,
    CleanupOrphanedResponse,
)

__all__ = [
    # Common schemas
    "PaginatedResponse",
    "MessageResponse",
    "ErrorResponse",
    # Auth schemas
    "RegisterRequest",
    "LoginRequest",
    "RefreshTokenRequest",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    "EmailVerificationRequest",
    "TokenResponse",
    "UserResponse",
    "LoginResponse",
    "MessageResponse",
    "ErrorResponse",
    # RBAC schemas
    "RoleCreateRequest",
    "RoleUpdateRequest",
    "AssignRoleRequest",
    "PermissionCreateRequest",
    "PermissionUpdateRequest",
    "AddPermissionToRoleRequest",
    "PermissionResponse",
    "RoleResponse",
    "UserPermissionsResponse",
    # Exercise schemas
    "ExerciseCategoryCreate",
    "ExerciseCategoryUpdate",
    "ExerciseCategoryResponse",
    "ExerciseCategoryReorder",
    "ExerciseCreate",
    "ExerciseUpdate",
    "ExerciseVersionCreate",
    "ExerciseResponse",
    "ExerciseDetailResponse",
    "ExerciseListResponse",
    "ExerciseItemCreate",
    "ExerciseItemUpdate",
    "ExerciseItemResponse",
    "ExerciseItemReorder",
    "ExerciseItemLibraryCreate",
    "ExerciseItemLibraryUpdate",
    "LibraryItemsListResponse",
    "AttachLibraryItemRequest",
    "DuplicateItemRequest",
    "ExerciseFromItemsCreate",
    # Media schemas
    "MediaFileUpload",
    "MediaFileResponse",
    "MediaFileDetailResponse",
    "MediaFileListResponse",
    "MediaFileSearchRequest",
    "StorageStatsResponse",
    "BulkDeleteRequest",
    "BulkDeleteResponse",
    "CleanupOrphanedResponse",
]
