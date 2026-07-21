"""
Unit tests for JWTHandler.

Tests JWT token operations including:
- Access token creation and validation
- Refresh token creation and validation
- Token expiry checking
- Claims extraction
- Signature verification
"""

import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import jwt

from src.infrastructure.security.jwt_handler import JWTHandler
from src.core.enums.security import TokenType
from src.core.exceptions.auth import TokenExpiredError, TokenInvalidError
from src.configurations.settings import settings


class TestJWTHandlerTokenCreation:
    """Tests for JWT token creation."""

    @pytest.fixture
    def jwt_handler(self) -> JWTHandler:
        return JWTHandler()

    def test_create_access_token_success(self, jwt_handler: JWTHandler):
        """Should create valid access token with correct claims."""
        # Arrange
        user_id = uuid4()
        email = "user@example.com"
        roles = ["user", "therapist"]
        permissions = ["users:read", "exercises:write"]

        # Act
        token = jwt_handler.create_access_token(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions,
        )

        # Assert
        assert isinstance(token, str)
        assert len(token) > 0

        # Decode and verify claims
        claims = jwt_handler.decode_token(token)
        assert claims["sub"] == str(user_id)
        assert claims["email"] == email
        assert claims["roles"] == roles
        assert claims["permissions"] == permissions
        assert claims["type"] == TokenType.ACCESS.value
        assert "exp" in claims
        assert "iat" in claims

    def test_create_access_token_custom_expiry(self, jwt_handler: JWTHandler):
        """Should create access token with custom expiry time."""
        # Arrange
        user_id = uuid4()
        custom_expiry = timedelta(hours=2)

        # Act
        token = jwt_handler.create_access_token(
            user_id=user_id,
            email="user@example.com",
            roles=[],
            permissions=[],
            expires_delta=int(custom_expiry.total_seconds()),
        )

        # Assert
        claims = jwt_handler.decode_token(token)
        exp_time = datetime.fromtimestamp(claims["exp"], tz=timezone.utc)
        expected_exp = datetime.now(timezone.utc) + custom_expiry
        
        # Allow 5 second tolerance for test execution time
        assert abs((exp_time - expected_exp).total_seconds()) < 5

    def test_create_refresh_token_success(self, jwt_handler: JWTHandler):
        """Should create valid refresh token with JTI."""
        # Arrange
        user_id = uuid4()

        # Act
        token, jti = jwt_handler.create_refresh_token(user_id)

        # Assert
        assert isinstance(token, str)
        assert isinstance(jti, str)
        assert len(token) > 0
        assert len(jti) > 0

        # Decode and verify claims
        claims = jwt_handler.decode_token(token)
        assert claims["sub"] == str(user_id)
        assert claims["jti"] == jti
        assert claims["type"] == TokenType.REFRESH.value
        assert "exp" in claims
        assert "iat" in claims

    def test_create_refresh_token_unique_jti(self, jwt_handler: JWTHandler):
        """Should create unique JTI for each refresh token."""
        # Arrange
        user_id = uuid4()

        # Act
        token1, jti1 = jwt_handler.create_refresh_token(user_id)
        token2, jti2 = jwt_handler.create_refresh_token(user_id)

        # Assert
        assert jti1 != jti2
        assert token1 != token2


class TestJWTHandlerTokenValidation:
    """Tests for JWT token validation and decoding."""

    @pytest.fixture
    def jwt_handler(self) -> JWTHandler:
        return JWTHandler()

    def test_decode_token_valid(self, jwt_handler: JWTHandler):
        """Should successfully decode valid token."""
        # Arrange
        user_id = uuid4()
        email = "user@example.com"
        token = jwt_handler.create_access_token(
            user_id, email, roles=[], permissions=[]
        )

        # Act
        claims = jwt_handler.decode_token(token)

        # Assert
        assert claims["sub"] == str(user_id)
        assert claims["email"] == email

    def test_decode_token_expired(self, jwt_handler: JWTHandler):
        """Should raise TokenExpiredError for expired token."""
        # Arrange - create token that expires immediately
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id=user_id,
            email="user@example.com",
            roles=[],
            permissions=[],
            expires_delta=-1,  # Already expired (1 second ago)
        )

        # Act & Assert
        with pytest.raises(TokenExpiredError) as exc_info:
            jwt_handler.decode_token(token)
        
        assert "expired" in str(exc_info.value).lower()

    def test_decode_token_invalid_signature(self, jwt_handler: JWTHandler):
        """Should raise TokenInvalidError for token with invalid signature."""
        # Arrange - create token with wrong signature
        user_id = uuid4()
        payload = {
            "sub": str(user_id),
            "email": "user@example.com",
            "type": TokenType.ACCESS.value,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
            "iat": datetime.now(timezone.utc),
        }
        # Sign with wrong key
        token = jwt.encode(payload, "wrong_secret_key", algorithm="HS256")

        # Act & Assert
        with pytest.raises(TokenInvalidError):
            jwt_handler.decode_token(token)

    def test_decode_token_malformed(self, jwt_handler: JWTHandler):
        """Should raise TokenInvalidError for malformed token."""
        # Arrange
        malformed_token = "not.a.valid.jwt.token"

        # Act & Assert
        with pytest.raises(TokenInvalidError):
            jwt_handler.decode_token(malformed_token)

    def test_decode_token_missing_claims(self, jwt_handler: JWTHandler):
        """Should decode token missing user_id but verify will fail."""
        # Arrange - create token without sub claim
        payload = {
            "email": "user@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
        # Get private key from settings
        if settings.jwt.algorithm == "RS256":
            with open(settings.jwt.private_key_path, 'r') as f:
                private_key = f.read()
        else:
            private_key = settings.jwt.secret_key
        token = jwt.encode(payload, private_key, algorithm=settings.jwt.algorithm)

        # Act - decode should work
        claims = jwt_handler.decode_token(token, verify=False)
        
        # Assert - claims are decoded but missing sub
        assert "email" in claims
        assert "sub" not in claims

    def test_verify_token_valid(self, jwt_handler: JWTHandler):
        """Should successfully verify valid access token."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id, "user@example.com", roles=[], permissions=[]
        )

        # Act
        payload = jwt_handler.verify_access_token(token)

        # Assert
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"

    def test_verify_token_expired(self, jwt_handler: JWTHandler):
        """Should raise TokenExpiredError for expired access token."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id=user_id,
            email="user@example.com",
            roles=[],
            permissions=[],
            expires_delta=-1,  # Already expired
        )

        # Act & Assert
        with pytest.raises(TokenExpiredError):
            jwt_handler.verify_access_token(token)

    def test_verify_token_invalid(self, jwt_handler: JWTHandler):
        """Should raise TokenInvalidError for invalid token."""
        # Act & Assert
        with pytest.raises(TokenInvalidError):
            jwt_handler.verify_access_token("invalid.token.here")


class TestJWTHandlerClaimsExtraction:
    """Tests for extracting claims from tokens."""

    @pytest.fixture
    def jwt_handler(self) -> JWTHandler:
        return JWTHandler()

    def test_get_token_claims_all_fields(self, jwt_handler: JWTHandler):
        """Should extract all claims from token."""
        # Arrange
        user_id = uuid4()
        email = "user@example.com"
        roles = ["admin", "user"]
        permissions = ["*:*"]
        
        token = jwt_handler.create_access_token(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions,
        )

        # Act
        claims = jwt_handler.decode_token(token)

        # Assert
        assert claims["sub"] == str(user_id)
        assert claims["email"] == email
        assert claims["roles"] == roles
        assert claims["permissions"] == permissions
        assert claims["type"] == TokenType.ACCESS.value

    def test_get_token_claims_minimal(self, jwt_handler: JWTHandler):
        """Should extract claims from token with minimal data."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id, "user@example.com", roles=[], permissions=[]
        )

        # Act
        claims = jwt_handler.decode_token(token)

        # Assert
        assert claims["sub"] == str(user_id)
        assert "email" in claims
        assert "type" in claims

    def test_get_token_claims_refresh_token(self, jwt_handler: JWTHandler):
        """Should extract JTI from refresh token."""
        # Arrange
        user_id = uuid4()
        token, jti = jwt_handler.create_refresh_token(user_id)

        # Act
        claims = jwt_handler.decode_token(token)

        # Assert
        assert claims["sub"] == str(user_id)
        assert claims["jti"] == jti
        assert claims["type"] == TokenType.REFRESH.value


class TestJWTHandlerExpiryChecking:
    """Tests for token expiry checking."""

    @pytest.fixture
    def jwt_handler(self) -> JWTHandler:
        return JWTHandler()

    def test_is_token_expired_not_expired(self, jwt_handler: JWTHandler):
        """Should return False for non-expired token."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id, "user@example.com", roles=[], permissions=[]
        )

        # Act
        result = jwt_handler.is_token_expired(token)

        # Assert
        assert result is False

    def test_is_token_expired_expired(self, jwt_handler: JWTHandler):
        """Should return True for expired token."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id=user_id,
            email="user@example.com",
            roles=[],
            permissions=[],
            expires_delta=-1,  # Already expired
        )

        # Act
        result = jwt_handler.is_token_expired(token)

        # Assert
        assert result is True

    def test_is_token_expired_invalid_token(self, jwt_handler: JWTHandler):
        """Should return True for invalid token."""
        # Act
        result = jwt_handler.is_token_expired("invalid.token")

        # Assert
        assert result is True


class TestJWTHandlerAlgorithm:
    """Tests for JWT algorithm configuration."""

    @pytest.fixture
    def jwt_handler(self) -> JWTHandler:
        return JWTHandler()

    def test_uses_rs256_algorithm(self, jwt_handler: JWTHandler):
        """Should use configured algorithm for signing."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id, "user@example.com", roles=[], permissions=[]
        )

        # Act - decode header to check algorithm
        header = jwt.get_unverified_header(token)

        # Assert
        assert header["alg"] == settings.jwt.algorithm

    def test_token_verifiable_with_public_key(self, jwt_handler: JWTHandler):
        """Should be able to verify token with configured key."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id, "user@example.com", roles=[], permissions=[]
        )

        # Act - verify with public key
        if settings.jwt.algorithm == "RS256":
            with open(settings.jwt.public_key_path, 'r') as f:
                public_key = f.read()
        else:
            public_key = settings.jwt.secret_key
        claims = jwt.decode(
            token,
            public_key,
            algorithms=[settings.jwt.algorithm],
        )

        # Assert
        assert claims["sub"] == str(user_id)

    @pytest.mark.skipif(
        settings.jwt.algorithm != "RS256",
        reason="Test only applies to RS256 algorithm"
    )
    def test_token_not_verifiable_with_wrong_key(self, jwt_handler: JWTHandler):
        """Should fail to verify token with wrong public key."""
        # Arrange
        user_id = uuid4()
        token = jwt_handler.create_access_token(
            user_id, "user@example.com", roles=[], permissions=[]
        )

        # Generate wrong RSA key pair
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        wrong_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )
        wrong_public_key = wrong_private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

        # Act & Assert
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(
                token,
                wrong_public_key,
                algorithms=["RS256"],
            )
