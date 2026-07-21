# ORMs als DataMapper zw. Datenbanktabellen ↔ Business-Objekten
from src.infrastructure.persistence.sqla.models.user import User
from src.infrastructure.persistence.sqla.models.role import Role, user_roles
from src.infrastructure.persistence.sqla.models.permission import Permission, role_permissions
from src.infrastructure.persistence.sqla.models.refresh_token import RefreshToken
from src.infrastructure.persistence.sqla.models.security_event import SecurityEvent

# Exercise models
from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
from src.infrastructure.persistence.sqla.models.media_file_model import MediaFileModel

# Practice session models
from src.infrastructure.persistence.sqla.models.practice_session_model import PracticeSessionModel
from src.infrastructure.persistence.sqla.models.exercise_result_model import ExerciseResultModel

__all__ = [
    "User",
    "Role",
    "Permission",
    "RefreshToken",
    "SecurityEvent",
    "user_roles",
    "role_permissions",
    # Exercise models
    "ExerciseCategoryModel",
    "ExerciseModel",
    "ExerciseInstructionsModel",
    "ExerciseItemModel",
    "ExerciseItemContentModel",
    "MediaFileModel",
    # Practice session models
    "PracticeSessionModel",
    "ExerciseResultModel",
]