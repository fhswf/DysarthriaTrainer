"""
Integration tests for authentication endpoints.

Tests all auth API endpoints with actual database interactions:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh
- POST /api/v1/auth/verify-email
- POST /api/v1/auth/password-reset/request
- POST /api/v1/auth/password-reset/confirm

Uses test database infrastructure from conftest.py with transaction-based isolation.
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.configurations.settings import Settings

# Get settings instance for tests
settings = Settings()


@pytest_asyncio.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """
    Create async test client with database session override.
    
    Overrides the database session dependency to use our test session
    which has automatic transaction rollback for test isolation.
    
    All API requests will use the same test session, ensuring:
    - Service commits are visible within the test
    - All changes are rolled back after test completion
    - No data persists between tests
    """
    # Import dependencies
    from src.api.dependencies import get_db
    
    # Override the Database.session method to yield our test session
    async def override_session():
        yield db_session
    
    # Apply the override - this replaces get_db().session in all dependencies
    app.dependency_overrides[get_db().session] = override_session
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        # Clear all overrides
        app.dependency_overrides.clear()


class TestRegisterEndpoint:
    """Integration tests for user registration endpoint."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        """
        Should successfully register new user.
        
        Transaction-based isolation ensures test data is automatically
        rolled back after test completion.
        """
        # Arrange
        payload = {
            "email": "newuser@test.com",
            "username": "newuser",
            "password": "SecurePass123!",
            "full_name": "New User",
        }

        # Act
        response = await client.post("/api/v1/auth/register", json=payload)

        # Assert
        if response.status_code != 201:
            print(f"\n❌ Unexpected status code: {response.status_code}")
            print(f"Response body: {response.json()}")
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == payload["email"]
        assert data["username"] == payload["username"]
        assert data["full_name"] == payload["full_name"]
        assert data["email_verified"] is False
        assert "id" in data
        assert "hashed_password" not in data  # Shouldn't expose password

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """Should return 409 Conflict for duplicate email."""
        # Arrange
        payload = {
            "email": "duplicate@test.com",
            "username": "user1",
            "password": "SecurePass123!",
        }
        await client.post("/api/v1/auth/register", json=payload)

        # Act - try to register with same email
        duplicate_payload = {
            "email": "duplicate@test.com",  # Same email
            "username": "user2",  # Different username
            "password": "SecurePass123!",
        }
        response = await client.post("/api/v1/auth/register", json=duplicate_payload)

        # Assert
        assert response.status_code == 409
        detail = response.json()["detail"].lower()
        assert "already" in detail and "email" in detail

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client: AsyncClient):
        """Should return 409 Conflict for duplicate username."""
        # Arrange
        payload = {
            "email": "user1@test.com",
            "username": "duplicateuser",
            "password": "SecurePass123!",
        }
        await client.post("/api/v1/auth/register", json=payload)

        # Act - try to register with same username
        duplicate_payload = {
            "email": "user2@test.com",  # Different email
            "username": "duplicateuser",  # Same username
            "password": "SecurePass123!",
        }
        response = await client.post("/api/v1/auth/register", json=duplicate_payload)

        # Assert
        assert response.status_code == 409
        detail = response.json()["detail"].lower()
        assert "already" in detail and "username" in detail

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client: AsyncClient):
        """Should return 422 Validation Error for weak password."""
        # Arrange
        payload = {
            "email": "user@test.com",
            "username": "testuser",
            "password": "weak",  # Too short, no uppercase, no special char
        }

        # Act
        response = await client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert response.status_code == 422
        # Pydantic validation error structure
        assert "detail" in response.json()

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Should return 422 Validation Error for invalid email."""
        # Arrange
        payload = {
            "email": "not-an-email",  # Invalid email format
            "username": "testuser",
            "password": "SecurePass123!",
        }

        # Act
        response = await client.post("/api/v1/auth/register", json=payload)

        # Assert
        assert response.status_code == 422  # Validation error


class TestLoginEndpoint:
    """Integration tests for user login endpoint."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        """Should successfully login and return tokens."""
        # Arrange - register user first
        register_payload = {
            "email": "loginuser@test.com",
            "username": "loginuser",
            "password": "SecurePass123!",
        }
        reg_response = await client.post("/api/v1/auth/register", json=register_payload)
        user_data = reg_response.json()
        
        # Verify email first (in real scenario, would use token from email)
        # For test, we'll skip email verification check by updating user in DB
        # Or we can test the unverified email error
        
        login_payload = {
            "email": "loginuser@test.com",
            "password": "SecurePass123!",
        }

        # Act
        response = await client.post("/api/v1/auth/login", json=login_payload)

        # Assert - will fail if email verification is required
        if settings.security.require_email_verification:
            assert response.status_code == 403  # Email not verified (Forbidden)
            assert "not verified" in response.json()["detail"].lower()
        else:
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
            assert "user" in data
            assert data["user"]["email"] == "loginuser@test.com"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Should return 401 for invalid credentials."""
        # Arrange
        payload = {
            "email": "nonexistent@test.com",
            "password": "WrongPass123!",
        }

        # Act
        response = await client.post("/api/v1/auth/login", json=payload)

        # Assert
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        """Should return 401 for wrong password."""
        # Arrange - register user
        register_payload = {
            "email": "user@test.com",
            "username": "testuser",
            "password": "CorrectPass123!",
        }
        await client.post("/api/v1/auth/register", json=register_payload)

        # Act - login with wrong password
        login_payload = {
            "email": "user@test.com",
            "password": "WrongPass123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)

        # Assert
        assert response.status_code == 401


class TestTokenRefreshEndpoint:
    """Integration tests for token refresh endpoint."""

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, client: AsyncClient, db_session):
        """Should successfully refresh access token."""
        # Arrange - register and login to get refresh token
        register_payload = {
            "email": "refreshuser@test.com",
            "username": "refreshuser",
            "password": "SecurePass123!",
        }
        await client.post("/api/v1/auth/register", json=register_payload)
        
        # Verify email if required
        if settings.security.require_email_verification:
            from sqlalchemy import text
            result = await db_session.execute(
                text("SELECT email_verification_token FROM users WHERE email = 'refreshuser@test.com'")
            )
            verification_token = result.scalar_one()
            await client.post(
                "/api/v1/auth/verify-email",
                json={"token": verification_token}
            )
        
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "refreshuser@test.com", "password": "SecurePass123!"}
        )
        refresh_token = login_response.json()["refresh_token"]

        # Act
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data  # New refresh token (rotation)
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Should return 400 for invalid refresh token."""
        # Arrange
        payload = {"refresh_token": "invalid.token.here"}

        # Act
        response = await client.post("/api/v1/auth/refresh", json=payload)

        # Assert
        assert response.status_code == 400  # Bad request for malformed token


class TestEmailVerificationEndpoint:
    """Integration tests for email verification endpoint."""

    @pytest.mark.asyncio
    async def test_verify_email_success(self, client: AsyncClient, db_session):
        """Should successfully verify email with valid token."""
        # Arrange - register user to get verification token
        register_payload = {
            "email": "verify@test.com",
            "username": "verifyuser",
            "password": "SecurePass123!",
        }
        reg_response = await client.post("/api/v1/auth/register", json=register_payload)
        
        # Get verification token from database (in real scenario, from email)
        from sqlalchemy import text
        result = await db_session.execute(
            text("SELECT email_verification_token FROM users WHERE email = 'verify@test.com'")
        )
        verification_token = result.scalar_one()

        # Act
        response = await client.post(
            "/api/v1/auth/verify-email",
            json={"token": verification_token}
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["email_verified"] is True

    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(self, client: AsyncClient):
        """Should return 400 for invalid verification token."""
        # Arrange
        payload = {"token": "invalid_token_12345"}

        # Act
        response = await client.post("/api/v1/auth/verify-email", json=payload)

        # Assert
        assert response.status_code == 400


class TestPasswordResetEndpoints:
    """Integration tests for password reset flow."""

    @pytest.mark.asyncio
    async def test_request_password_reset_success(self, client: AsyncClient):
        """Should successfully send password reset request."""
        # Arrange - register user
        register_payload = {
            "email": "reset@test.com",
            "username": "resetuser",
            "password": "OldPass123!",
        }
        await client.post("/api/v1/auth/register", json=register_payload)

        # Act
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "reset@test.com"}
        )

        # Assert
        assert response.status_code == 200
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_request_password_reset_nonexistent_email(
        self, client: AsyncClient
    ):
        """Should return success even for non-existent email (security measure)."""
        # Act
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "nonexistent@test.com"}
        )

        # Assert
        assert response.status_code == 200  # Don't reveal if email exists

    @pytest.mark.asyncio
    async def test_reset_password_success(self, client: AsyncClient, db_session):
        """Should successfully reset password with valid token."""
        # Arrange - register user and request password reset
        register_payload = {
            "email": "resetpass@test.com",
            "username": "resetpassuser",
            "password": "OldPass123!",
        }
        await client.post("/api/v1/auth/register", json=register_payload)
        
        await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "resetpass@test.com"}
        )
        
        # Get reset token from database
        from sqlalchemy import text
        result = await db_session.execute(
            text("SELECT password_reset_token FROM users WHERE email = 'resetpass@test.com'")
        )
        reset_token = result.scalar_one()

        # Act
        response = await client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": reset_token,
                "new_password": "NewSecurePass123!"
            }
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "resetpass@test.com"

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self, client: AsyncClient):
        """Should return 400 for invalid reset token."""
        # Arrange
        payload = {
            "token": "invalid_reset_token",
            "new_password": "NewPass123!"
        }

        # Act
        response = await client.post("/api/v1/auth/password-reset/confirm", json=payload)

        # Assert
        assert response.status_code == 400


class TestLogoutEndpoint:
    """Integration tests for user logout endpoint."""

    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient, db_session):
        """Should successfully logout and revoke refresh token."""
        # Arrange - register and login
        register_payload = {
            "email": "logoutuser@test.com",
            "username": "logoutuser",
            "password": "SecurePass123!",
        }
        await client.post("/api/v1/auth/register", json=register_payload)
        
        # Verify email if required
        if settings.security.require_email_verification:
            from sqlalchemy import text
            result = await db_session.execute(
                text("SELECT email_verification_token FROM users WHERE email = 'logoutuser@test.com'")
            )
            verification_token = result.scalar_one()
            await client.post(
                "/api/v1/auth/verify-email",
                json={"token": verification_token}
            )
        
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "logoutuser@test.com", "password": "SecurePass123!"}
        )
        refresh_token = login_response.json()["refresh_token"]

        # Act
        response = await client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token}
        )

        # Assert
        assert response.status_code == 200
        
        # Verify token is revoked by trying to refresh
        refresh_response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 401  # Token should be revoked
