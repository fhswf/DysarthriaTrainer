# Dependency Provider
from __future__ import annotations

import os
from typing import Annotated, TYPE_CHECKING
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from src.configurations.logger import configure_logger
from src.configurations.settings import Settings

from src.core.ports.services import IUserService, IExerciseService
from src.core.ports.repositories import (
    IUserRepository,
    IExerciseRepository,
    IExerciseCategoryRepository,
    IExerciseItemRepository,
    IRefreshTokenRepository,
    ISecurityEventRepository,
    IRoleRepository,
    IPermissionRepository,
    IMediaFileRepository,
)
from src.core.ports.repositories.exercise_result_repository import IExerciseResultRepository
from src.core.ports.repositories.practice_session_repository import IPracticeSessionRepository
from src.core.ports.storage import IStorageBackend
from src.core.ports import (
    IPasswordHasher,
    IEntityIdGenerator,
    ILogger,
    IASRService,
    IPhonemeRecognitionService
)
from src.core.ports.utils.audio_loader import IAudioLoader
from src.core.ports.jwt_handler import IJWTHandler
from src.core.entities.user import User
from src.core.exceptions.auth import TokenExpiredError, TokenInvalidError

# Forward references for type checking
if TYPE_CHECKING:
    from src.application.services.practice_session_service import PracticeSessionService
    from src.application.services.result_analysis_service import ResultAnalysisService
    from src.application.services.session_analysis_orchestrator import SessionAnalysisOrchestrator

# TODO: Service-Interfaces für Mocks...
from src.application.services import (
    UserService,
    ExerciseService,
    AuthService,
    RBACService,
)
from src.application.services.media_service import MediaService

from src.infrastructure.inference.asr.faster_whisper_adapter import FasterWhisperAdapter
from src.infrastructure.inference.phoneme_recognition.transformer_ctc.config import TransformerCTCConfig
from src.infrastructure.inference.phoneme_recognition.transformer_ctc.adapter import TransformerCTCAdapter
from src.infrastructure.inference.audio.audio_preprocessor import AudioPreprocessor

from src.application.services.audio_analysis_service import AudioAnalysisService
from src.api.helpers.connection_manager import ConnectionManager
from src.infrastructure.persistence.sqla.database import Database
from src.infrastructure.persistence.sqla.repositories import (
    UserRepository,
    ExerciseRepository,
    MediaFileRepository,
)
from src.infrastructure.persistence.sqla.repositories.exercise_result_repository import ExerciseResultRepository
from src.infrastructure.persistence.sqla.repositories.practice_session_repository import PracticeSessionRepository
from src.infrastructure.persistence.sqla.repositories.exercise_category import ExerciseCategoryRepository
from src.infrastructure.persistence.sqla.repositories.exercise_item import ExerciseItemRepository
from src.infrastructure.persistence.sqla.repositories.refresh_token_repository import RefreshTokenRepository
from src.infrastructure.persistence.sqla.repositories.security_event_repository import SecurityEventRepository
from src.infrastructure.persistence.sqla.repositories.role_repository import RoleRepository
from src.infrastructure.persistence.sqla.repositories.permission_repository import PermissionRepository
from src.infrastructure.storage.local_file_storage import LocalFileStorage
from src.infrastructure.utils.entity_id_generator import UUIDEntityIdGenerator
from src.infrastructure.security.password_hasher import BcryptPasswordHasher
from src.infrastructure.utils.audio.audio_loader import LibrosaAudioLoader
from src.infrastructure.security.jwt_handler import JWTHandler


# ------ Configuration & Logger ------
@lru_cache(maxsize=1)
def get_app_config() -> Settings:
    return Settings()


# TODO: Logger-Factory
@lru_cache(maxsize=1)
def get_logger(
) -> ILogger:
    return configure_logger(
        name="API",
        lvl=str(get_app_config().log_level).upper()
    )


# ------ WebSocket Connection Manager ------
@lru_cache(maxsize=1)
def get_connection_manager() -> ConnectionManager:
    """Get singleton ConnectionManager with logger dependency."""
    return ConnectionManager(logger=get_logger())


# ------ Utilities ------
def get_entity_id_generator() -> IEntityIdGenerator:
    return UUIDEntityIdGenerator()


def get_password_hasher() -> IPasswordHasher:
    return BcryptPasswordHasher()


def get_jwt_handler() -> IJWTHandler:
    return JWTHandler()


# ------ Database ------
@lru_cache(maxsize=1)
def get_db() -> Database:
    return Database(
        get_app_config().database_url,
        logger=get_logger()
    )


async def get_db_session() -> AsyncSession:
    """Get database session for direct SQLAlchemy queries."""
    async for session in get_db().session():
        yield session


# ------ Repositories ------
async def get_user_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IUserRepository:
    return UserRepository(
        session=session
        # mapper=UserMapper()
    )


async def get_exercise_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IExerciseRepository:
    return ExerciseRepository(
        session=session
        # mapper=UserMapper()
    )


async def get_exercise_category_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IExerciseCategoryRepository:
    return ExerciseCategoryRepository(session=session)


async def get_exercise_item_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IExerciseItemRepository:
    return ExerciseItemRepository(session=session)


async def get_refresh_token_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IRefreshTokenRepository:
    return RefreshTokenRepository(session=session)


async def get_security_event_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> ISecurityEventRepository:
    return SecurityEventRepository(session=session)


async def get_role_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IRoleRepository:
    return RoleRepository(session=session)


async def get_permission_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IPermissionRepository:
    return PermissionRepository(session=session)


async def get_media_file_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IMediaFileRepository:
    return MediaFileRepository(session=session)


async def get_exercise_result_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IExerciseResultRepository:
    return ExerciseResultRepository(session=session)


async def get_practice_session_repository(session: Annotated[AsyncSession, Depends(get_db().session)]) -> IPracticeSessionRepository:
    return PracticeSessionRepository(session=session)


# ------ Storage Backend ------
def get_storage_backend(
    config: Settings = Depends(get_app_config),
) -> IStorageBackend:
    """
    Get storage backend based on configuration.
    
    Factory pattern allows switching backends via config.
    Currently supports local filesystem, with S3 and Azure planned.
    """
    backend_type = config.media_storage.backend.lower()
    
    if backend_type == "local":
        return LocalFileStorage(
            base_path=config.media_storage.base_path,
            base_url=config.media_storage.base_url,
        )
    elif backend_type == "s3":
        # Future: return S3Storage(...)
        raise NotImplementedError("S3 storage backend not yet implemented")
    elif backend_type == "azure":
        # Future: return AzureStorage(...)
        raise NotImplementedError("Azure storage backend not yet implemented")
    else:
        raise ValueError(f"Unknown storage backend: {backend_type}")


# ------ Application Services ------
def get_user_service(
        logger: Annotated[ILogger, Depends(get_logger)],
        user_repository: IUserRepository = Depends(get_user_repository),
        entity_id_generator: IEntityIdGenerator = Depends(get_entity_id_generator),
        password_hasher: IPasswordHasher = Depends(get_password_hasher),
) -> IUserService:
    return UserService(
        user_repository=user_repository,
        id_generator=entity_id_generator,
        password_hasher=password_hasher,
        logger=logger
    )


def get_exercise_service(
        exercise_repository: IExerciseRepository = Depends(get_exercise_repository),
        category_repository: IExerciseCategoryRepository = Depends(get_exercise_category_repository),
        item_repository: IExerciseItemRepository = Depends(get_exercise_item_repository),
) -> IExerciseService:
    return ExerciseService(
        exercise_repository=exercise_repository,
        category_repository=category_repository,
        item_repository=item_repository,
    )


def get_auth_service(
        user_repository: IUserRepository = Depends(get_user_repository),
        refresh_token_repository: IRefreshTokenRepository = Depends(get_refresh_token_repository),
        security_event_repository: ISecurityEventRepository = Depends(get_security_event_repository),
        role_repository: IRoleRepository = Depends(get_role_repository),
        jwt_handler: IJWTHandler = Depends(get_jwt_handler),
        password_hasher: IPasswordHasher = Depends(get_password_hasher),
) -> AuthService:
    return AuthService(
        user_repository=user_repository,
        refresh_token_repository=refresh_token_repository,
        security_event_repository=security_event_repository,
        role_repository=role_repository,
        jwt_handler=jwt_handler,
        password_hasher=password_hasher,
    )


def get_rbac_service(
        role_repository: IRoleRepository = Depends(get_role_repository),
        permission_repository: IPermissionRepository = Depends(get_permission_repository),
) -> RBACService:
    return RBACService(
        role_repository=role_repository,
        permission_repository=permission_repository,
    )


def get_media_service(
        media_repository: IMediaFileRepository = Depends(get_media_file_repository),
        storage_backend: IStorageBackend = Depends(get_storage_backend),
        config: Settings = Depends(get_app_config),
) -> MediaService:
    return MediaService(
        media_repository=media_repository,
        storage_backend=storage_backend,
        cdn_base_url=config.media_storage.cdn_url,
    )


# ------ Authentication Dependencies ------
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    jwt_handler: IJWTHandler = Depends(get_jwt_handler),
    user_repository: IUserRepository = Depends(get_user_repository),
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        jwt_handler: JWT handler for token validation
        user_repository: User repository for loading user
        
    Returns:
        User entity
        
    Raises:
        HTTPException: 401 if token is invalid, expired, or user not found
    """
    token = credentials.credentials
    
    try:
        # Verify and decode token
        claims = jwt_handler.decode_token(token)
        
        # Extract user_id from claims (JWT standard uses "sub" for subject/user ID)
        user_id = claims.get("sub") or claims.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Load user from database
        user = await user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user account is disabled
        if user.disabled:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user account is locked
        from datetime import datetime, timezone
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is locked due to too many failed login attempts",
            )
        
        return user
        
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except TokenInvalidError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_permission(*permissions: str):
    """
    Dependency factory for requiring specific permissions.
    
    Usage:
        @router.get("/users", dependencies=[Depends(require_permission("users:read"))])
        
    Args:
        *permissions: One or more permission names required (e.g., "users:read", "exercises:write")
        
    Returns:
        Dependency function that checks if user has required permissions
    """
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> User:
        """Check if current user has required permissions."""
        try:
            # Check if user has all required permissions
            has_permission = await rbac_service.check_all_permissions(
                user_id=current_user.id,
                permission_names=list(permissions),
                raise_exception=False
            )
            
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permissions: {', '.join(permissions)}"
                )
            
            return current_user
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission check failed: {str(e)}"
            )
    
    return permission_checker


def require_any_permission(*permissions: str):
    """
    Dependency factory for requiring at least one of the specified permissions.
    
    Usage:
        @router.get("/data", dependencies=[Depends(require_any_permission("users:read", "admin:all"))])
        
    Args:
        *permissions: One or more permission names (user needs at least one)
        
    Returns:
        Dependency function that checks if user has at least one required permission
    """
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> User:
        """Check if current user has at least one of the required permissions."""
        try:
            has_permission = await rbac_service.check_any_permission(
                user_id=current_user.id,
                permission_names=list(permissions),
                raise_exception=False
            )
            
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires at least one of: {', '.join(permissions)}"
                )
            
            return current_user
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission check failed: {str(e)}"
            )
    
    return permission_checker


def require_role(*roles: str):
    """
    Dependency factory for requiring specific roles.
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("admin"))])
        
    Args:
        *roles: One or more role names required (e.g., "admin", "therapist")
        
    Returns:
        Dependency function that checks if user has required roles
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> User:
        """Check if current user has required roles."""
        try:
            # Get user's roles
            user_roles = await rbac_service.get_user_roles(current_user.id)
            user_role_names = {role.name for role in user_roles}
            
            # Check if user has any of the required roles
            required_roles = set(roles)
            has_role = bool(required_roles & user_role_names)
            
            if not has_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of these roles: {', '.join(roles)}"
                )
            
            return current_user
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role check failed: {str(e)}"
            )
    
    return role_checker


async def is_admin(
    current_user: User = Depends(get_current_user),
    rbac_service: RBACService = Depends(get_rbac_service),
) -> bool:
    """
    Check if the current user has admin or super_admin role.
    
    Args:
        current_user: Currently authenticated user
        rbac_service: RBAC service for role checking
        
    Returns:
        True if user has admin or super_admin role, False otherwise
    """
    try:
        user_roles = await rbac_service.get_user_roles(current_user.id)
        user_role_names = {role.name for role in user_roles}
        return "admin" in user_role_names or "super_admin" in user_role_names
    except Exception:
        return False


# ------ Utility Services ------

def get_audio_loader(
        logger: Annotated[ILogger, Depends(get_logger)]
) -> IAudioLoader:
    return LibrosaAudioLoader(logger=logger)


# ------ Utility Services ------

def get_audio_loader(
        logger: Annotated[ILogger, Depends(get_logger)]
) -> IAudioLoader:
    return LibrosaAudioLoader(logger=logger)


# ------ Inference services ------
def get_asr_service(
        logger: Annotated[ILogger, Depends(get_logger)]
) -> IASRService:
    return FasterWhisperAdapter(
        logger=logger,
        model_size="base",
        device="cpu",
        compute_type="int8",
        language="de"
    )


@lru_cache()
def get_phoneme_service(
) -> IPhonemeRecognitionService:
    return TransformerCTCAdapter(
        logger=get_logger(),
        config=TransformerCTCConfig()
    )


# ------ Audio Processing Services ------
def get_audio_preprocessor() -> AudioPreprocessor:
    """Get audio preprocessor instance."""
    return AudioPreprocessor(
        target_sample_rate=16000,
        noise_reduction_strength=0.5,
    )


def get_audio_analysis_service(
        preprocessor: AudioPreprocessor = Depends(get_audio_preprocessor),
        asr_service: IASRService = Depends(get_asr_service),
        logger: ILogger = Depends(get_logger),
) -> AudioAnalysisService:
    """Get audio analysis service with dependencies."""
    return AudioAnalysisService(
        preprocessor=preprocessor,
        asr_service=asr_service,
        logger=logger,
    )


# ------ Session Result Processing Services ------
def get_audio_segment_extractor(
        storage: Annotated[IStorageBackend, Depends(get_storage_backend)],
        media_repo: Annotated[IMediaFileRepository, Depends(get_media_file_repository)],
        logger: Annotated[ILogger, Depends(get_logger)],
) -> 'AudioSegmentExtractor':
    """Get audio segment extractor instance."""
    from src.application.services.audio_segment_extractor import AudioSegmentExtractor
    return AudioSegmentExtractor(
        storage=storage,
        media_repo=media_repo,
        logger=logger,
    )


def get_result_analysis_service(
        segment_extractor: Annotated['AudioSegmentExtractor', Depends(get_audio_segment_extractor)],
        audio_service: Annotated[AudioAnalysisService, Depends(get_audio_analysis_service)],
        phoneme_service: Annotated[IPhonemeRecognitionService, Depends(get_phoneme_service)],
        result_repo: Annotated['IExerciseResultRepository', Depends(get_exercise_result_repository)],
        logger: Annotated[ILogger, Depends(get_logger)],
) -> 'ResultAnalysisService':
    """Get result analysis service instance."""
    from src.application.services.result_analysis_service import ResultAnalysisService
    return ResultAnalysisService(
        segment_extractor=segment_extractor,
        audio_service=audio_service,
        phoneme_service=phoneme_service,
        result_repo=result_repo,
        logger=logger,
    )


def get_session_analysis_orchestrator(
        result_service: Annotated['ResultAnalysisService', Depends(get_result_analysis_service)],
        session_repo: Annotated[IPracticeSessionRepository, Depends(get_practice_session_repository)],
        result_repo: Annotated[IExerciseResultRepository, Depends(get_exercise_result_repository)],
        exercise_repo: Annotated[IExerciseRepository, Depends(get_exercise_repository)],
        exercise_item_repo: Annotated[IExerciseItemRepository, Depends(get_exercise_item_repository)],
        logger: Annotated[ILogger, Depends(get_logger)],
) -> 'SessionAnalysisOrchestrator':
    """Get session analysis orchestrator instance."""
    from src.application.services.session_analysis_orchestrator import SessionAnalysisOrchestrator
    return SessionAnalysisOrchestrator(
        result_service=result_service,
        session_repo=session_repo,
        result_repo=result_repo,
        exercise_repo=exercise_repo,
        exercise_item_repo=exercise_item_repo,
        logger=logger,
    )
