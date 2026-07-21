from uuid import UUID

from src.core.entities.user import User
from src.core.exceptions.user import UsernameAlreadyExistsError
from src.core.exceptions.entity_not_found import UserNotFoundError
from src.core.ports.services.user import IUserService
from src.core.ports.repositories.user import IUserRepository
from src.core.ports.security.password_hasher import IPasswordHasher
from src.core.ports.utils.entity_id_generator import IEntityIdGenerator
from src.core.ports.utils.logger_protocol import ILogger


class UserService(IUserService):

    def __init__(self,
                 user_repository: IUserRepository,
                 id_generator: IEntityIdGenerator,
                 password_hasher: IPasswordHasher,
                 logger: ILogger
                 ) -> None:
        # TODO: Basic-DBService-Implementierung
        self._repository: IUserRepository = user_repository
        self._id_generator: IEntityIdGenerator = id_generator
        self._pw_hasher: IPasswordHasher = password_hasher
        self._logger: ILogger = logger

    async def create_user(self, username: str, password: str, email: str) -> User:
        # TODO: Add validation, error handling, logging, etc.
        if await self._repository.exists_by_username(username):
            self._logger.error(f"User creation failed: Username '{username}' already exists.")
            raise UsernameAlreadyExistsError(username)

        user = User(
            id=self._id_generator(),
            username=username,
            email=email,
            hashed_password=self._pw_hasher.hash_password(password),
            # ... other fields
        )
        await self._repository.add(user)
        self._logger.debug(f"Creating user: {user.model_dump(exclude={"hashed_password"})}")
        return user

    async def get_user_by_id(self, user_id) -> User | None:
        return await self._repository.get_by_id(user_id)

    async def get_user_by_email(self, email) -> User | None:
        return await self._repository.get_by_email(email)

    async def get_users(self) -> list[User]:
        """Retrieve all users.
        
        Returns:
            List of all users
            
        Raises:
            Exception: Any database or repository errors are propagated
        """
        self._logger.debug("Retrieving all users")
        users = await self._repository.get_all()
        self._logger.debug(f"Retrieved {len(users)} users successfully")
        return users

    async def update_user(self, user_id: UUID, **updates) -> User:
        """Update an existing user.
        
        Args:
            user_id: UUID of user to update
            **updates: Fields to update (email, full_name, disabled, etc.)
            
        Returns:
            Updated user entity
            
        Raises:
            UserNotFoundError: If user does not exist
        """
        self._logger.debug(f"Updating user {user_id} with fields: {list(updates.keys())}")
        
        # Get existing user
        user = await self._repository.get_by_id(user_id)
        if user is None:
            self._logger.error(f"User update failed: User with id '{user_id}' not found")
            raise UserNotFoundError(user_id)
        
        # Create updated user with merged data
        user_data = user.model_dump()
        
        # Don't allow changing username or hashed_password through this method
        updates.pop('username', None)
        updates.pop('hashed_password', None)
        
        # Merge updates into user data
        user_data.update(updates)
        
        updated_user = User(**user_data)
        
        # Save to repository
        result = await self._repository.update(updated_user)
        self._logger.debug(f"User {user_id} updated successfully")
        return result

    async def delete_user(self, user_id: UUID) -> bool:
        """Delete a user.
        
        Args:
            user_id: UUID of user to delete
            
        Returns:
            True if deleted, False if not found
        """
        self._logger.debug(f"Deleting user {user_id}")
        result = await self._repository.delete(user_id)
        
        if result:
            self._logger.debug(f"User {user_id} deleted successfully")
        else:
            self._logger.warning(f"User {user_id} not found for deletion")
        
        return result