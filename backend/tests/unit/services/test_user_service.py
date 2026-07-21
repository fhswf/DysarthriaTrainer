import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, Mock

from src.application.services.user_service import UserService
from src.core.entities.user import User
from src.core.exceptions.user import UsernameAlreadyExistsError
from src.core.exceptions.entity_not_found import UserNotFoundError
from src.core.ports.repositories.user import IUserRepository
from src.core.ports.security.password_hasher import IPasswordHasher
from src.core.ports.utils.entity_id_generator import IEntityIdGenerator
from src.core.ports.utils.logger_protocol import ILogger


class TestUserService:
    """Unit tests for UserService."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        """Create a mock user repository."""
        repository = AsyncMock(spec=IUserRepository)
        return repository

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        """Create a mock password hasher."""
        hasher = Mock(spec=IPasswordHasher)
        hasher.hash_password.return_value = "hashed_password_123"
        return hasher

    @pytest.fixture
    def mock_id_generator(self) -> Mock:
        """Create a mock ID generator."""
        generator = Mock(spec=IEntityIdGenerator)
        generator.return_value = uuid4()
        return generator

    @pytest.fixture
    def mock_logger(self) -> Mock:
        """Create a mock logger."""
        logger = Mock(spec=ILogger)
        return logger

    @pytest.fixture
    def user_service(
        self,
        mock_user_repository: AsyncMock,
        mock_id_generator: Mock,
        mock_password_hasher: Mock,
        mock_logger: Mock
    ) -> UserService:
        """Create a UserService instance with mocked dependencies."""
        return UserService(
            user_repository=mock_user_repository,
            id_generator=mock_id_generator,
            password_hasher=mock_password_hasher,
            logger=mock_logger
        )

    @pytest.mark.asyncio
    async def test_create_user_success(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        mock_password_hasher: Mock,
        mock_id_generator: Mock
    ):
        """Should create a user with valid data."""
        # Arrange
        username = "testuser"
        email = "test@example.com"
        password = "SecurePass123"
        user_id = mock_id_generator.return_value
        
        mock_user_repository.exists_by_username.return_value = False
        mock_user_repository.add.return_value = None

        # Act
        user = await user_service.create_user(
            username=username,
            password=password,
            email=email
        )

        # Assert
        assert user.username == username
        assert user.email == email
        assert user.id == user_id
        assert user.hashed_password == "hashed_password_123"
        
        mock_user_repository.exists_by_username.assert_called_once_with(username)
        mock_password_hasher.hash_password.assert_called_once_with(password)
        mock_user_repository.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_duplicate_username(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock,
        mock_logger: Mock
    ):
        """Should raise error when username already exists."""
        # Arrange
        username = "existinguser"
        email = "test@example.com"
        password = "SecurePass123"
        
        mock_user_repository.exists_by_username.return_value = True

        # Act & Assert
        with pytest.raises(UsernameAlreadyExistsError) as exc_info:
            await user_service.create_user(
                username=username,
                password=password,
                email=email
            )
        
        assert username in str(exc_info.value)
        mock_user_repository.exists_by_username.assert_called_once_with(username)
        mock_user_repository.add.assert_not_called()
        mock_logger.error.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_by_id_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return user when found by ID."""
        # Arrange
        user_id = uuid4()
        expected_user = User(
            id=user_id,
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password"
        )
        mock_user_repository.get_by_id.return_value = expected_user

        # Act
        user = await user_service.get_user_by_id(user_id)

        # Assert
        assert user == expected_user
        assert user.username == "testuser"
        mock_user_repository.get_by_id.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return None when user not found by ID."""
        # Arrange
        user_id = uuid4()
        mock_user_repository.get_by_id.return_value = None

        # Act
        user = await user_service.get_user_by_id(user_id)

        # Assert
        assert user is None
        mock_user_repository.get_by_id.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_get_user_by_email_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return user when found by email."""
        # Arrange
        email = "test@example.com"
        expected_user = User(
            id=uuid4(),
            username="testuser",
            email=email,
            hashed_password="hashed_password"
        )
        mock_user_repository.get_by_email.return_value = expected_user

        # Act
        user = await user_service.get_user_by_email(email)

        # Assert
        assert user == expected_user
        assert user.email == email
        mock_user_repository.get_by_email.assert_called_once_with(email)

    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return None when user not found by email."""
        # Arrange
        email = "nonexistent@example.com"
        mock_user_repository.get_by_email.return_value = None

        # Act
        user = await user_service.get_user_by_email(email)

        # Assert
        assert user is None
        mock_user_repository.get_by_email.assert_called_once_with(email)

    @pytest.mark.asyncio
    async def test_get_users_returns_list(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return list of all users."""
        # Arrange
        users = [
            User(
                id=uuid4(),
                username="user1",
                email="user1@example.com",
                hashed_password="hash1"
            ),
            User(
                id=uuid4(),
                username="user2",
                email="user2@example.com",
                hashed_password="hash2"
            ),
        ]
        mock_user_repository.get_all.return_value = users

        # Act
        result = await user_service.get_users()

        # Assert
        assert len(result) == 2
        assert result == users
        mock_user_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_users_empty_list(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return empty list when no users exist."""
        # Arrange
        mock_user_repository.get_all.return_value = []

        # Act
        result = await user_service.get_users()

        # Assert
        assert result == []
        mock_user_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_success(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should update user successfully."""
        # Arrange
        user_id = uuid4()
        existing_user = User(
            id=user_id,
            username="testuser",
            email="old@example.com",
            hashed_password="hashed",
            full_name="Old Name"
        )
        updated_user = User(
            id=user_id,
            username="testuser",
            email="new@example.com",
            hashed_password="hashed",
            full_name="New Name"
        )
        
        mock_user_repository.get_by_id.return_value = existing_user
        mock_user_repository.update.return_value = updated_user

        # Act
        result = await user_service.update_user(
            user_id,
            email="new@example.com",
            full_name="New Name"
        )

        # Assert
        assert result.email == "new@example.com"
        assert result.full_name == "New Name"
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_user_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should raise error when updating non-existent user."""
        # Arrange
        user_id = uuid4()
        mock_user_repository.get_by_id.return_value = None

        # Act & Assert
        with pytest.raises(UserNotFoundError):
            await user_service.update_user(user_id, email="new@example.com")
        
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_user_repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_user_success(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should delete user successfully."""
        # Arrange
        user_id = uuid4()
        mock_user_repository.delete.return_value = True

        # Act
        result = await user_service.delete_user(user_id)

        # Assert
        assert result is True
        mock_user_repository.delete.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_delete_user_not_found(
        self,
        user_service: UserService,
        mock_user_repository: AsyncMock
    ):
        """Should return False when deleting non-existent user."""
        # Arrange
        user_id = uuid4()
        mock_user_repository.delete.return_value = False

        # Act
        result = await user_service.delete_user(user_id)

        # Assert
        assert result is False
        mock_user_repository.delete.assert_called_once_with(user_id)

