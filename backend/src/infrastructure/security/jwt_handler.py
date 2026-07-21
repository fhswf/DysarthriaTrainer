"""
JWT Handler implementation using PyJWT with RS256 signing.
"""

import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt

from src.configurations.settings import settings
from src.core.exceptions.auth import TokenExpiredError, TokenInvalidError
from src.core.ports.jwt_handler import IJWTHandler


class JWTHandler(IJWTHandler):
    """JWT token generation and validation using RS256 or HS256 algorithm."""
    
    def __init__(self):
        self._algorithm = settings.jwt.algorithm
        self._access_token_expire = settings.jwt.access_token_expire_minutes
        self._refresh_token_expire = settings.jwt.refresh_token_expire_days
        
        # Load RSA keys if using RS256, otherwise use secret_key for HS256
        if self._algorithm == "RS256":
            self._private_key = self._load_private_key()
            self._public_key = self._load_public_key()
        else:
            # For HS256, use the secret key
            self._private_key = settings.jwt.secret_key
            self._public_key = settings.jwt.secret_key
    
    def _load_private_key(self) -> str:
        """Load RSA private key from file or use environment variable."""
        if settings.jwt.private_key_path:
            with open(settings.jwt.private_key_path, 'r') as f:
                return f.read()
        raise ValueError("RS256 requires private_key_path to be set")
    
    def _load_public_key(self) -> str:
        """Load RSA public key from file or use environment variable."""
        if settings.jwt.public_key_path:
            with open(settings.jwt.public_key_path, 'r') as f:
                return f.read()
        raise ValueError("RS256 requires public_key_path to be set")
    
    def create_access_token(
        self,
        user_id: UUID,
        email: str,
        roles: list[str],
        permissions: list[str],
        expires_delta: int | None = None
    ) -> str:
        """Create a JWT access token."""
        now = datetime.now(timezone.utc)
        
        if expires_delta:
            expire = now + timedelta(seconds=expires_delta)
        else:
            expire = now + timedelta(minutes=self._access_token_expire)
        
        payload = {
            "sub": str(user_id),
            "email": email,
            "roles": roles,
            "permissions": permissions,
            "type": "access",
            "exp": expire,
            "iat": now,
        }
        
        return jwt.encode(
            payload,
            self._private_key,
            algorithm=self._algorithm
        )
    
    def create_refresh_token(
        self,
        user_id: UUID,
        expires_delta: int | None = None
    ) -> tuple[str, str]:
        """Create a JWT refresh token."""
        from uuid import uuid4
        
        jti = str(uuid4())
        now = datetime.now(timezone.utc)
        
        if expires_delta:
            expire = now + timedelta(seconds=expires_delta)
        else:
            expire = now + timedelta(days=self._refresh_token_expire)
        
        payload = {
            "sub": str(user_id),
            "jti": jti,
            "type": "refresh",
            "exp": expire,
            "iat": now,
        }
        
        token = jwt.encode(
            payload,
            self._private_key,
            algorithm=self._algorithm
        )
        
        return token, jti
    
    def verify_access_token(self, token: str) -> dict:
        """Verify and decode a JWT access token."""
        try:
            payload = jwt.decode(
                token,
                self._public_key,
                algorithms=[self._algorithm]
            )
            
            if payload.get("type") != "access":
                raise TokenInvalidError("Invalid token type")
            
            return payload
        
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Access token has expired")
        except jwt.InvalidTokenError as e:
            raise TokenInvalidError(f"Invalid access token: {str(e)}")
    
    def verify_refresh_token(self, token: str) -> dict:
        """Verify and decode a JWT refresh token."""
        try:
            payload = jwt.decode(
                token,
                self._public_key,
                algorithms=[self._algorithm]
            )
            
            if payload.get("type") != "refresh":
                raise TokenInvalidError("Invalid token type")
            
            return payload
        
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Refresh token has expired")
        except jwt.InvalidTokenError as e:
            raise TokenInvalidError(f"Invalid refresh token: {str(e)}")
    
    def decode_token(self, token: str, verify: bool = True) -> dict:
        """Decode a JWT token without verification (for inspection)."""
        try:
            if verify:
                return jwt.decode(
                    token,
                    self._public_key,
                    algorithms=[self._algorithm]
                )
            else:
                return jwt.decode(
                    token,
                    options={"verify_signature": False}
                )
        
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise TokenInvalidError(f"Invalid token: {str(e)}")
    
    def get_token_expiry(self, token: str) -> datetime:
        """Get the expiration time of a token."""
        try:
            payload = self.decode_token(token, verify=False)
            exp_timestamp = payload.get("exp")
            
            if not exp_timestamp:
                raise TokenInvalidError("Token missing expiration claim")
            
            return datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        
        except Exception as e:
            raise TokenInvalidError(f"Cannot extract expiry: {str(e)}")
    
    def is_token_expired(self, token: str) -> bool:
        """Check if a token has expired."""
        try:
            expiry = self.get_token_expiry(token)
            return datetime.now(timezone.utc) >= expiry
        except TokenInvalidError:
            return True
    
    def extract_user_id(self, token: str) -> UUID:
        """Extract user ID from a token."""
        try:
            payload = self.decode_token(token, verify=False)
            user_id_str = payload.get("sub")
            
            if not user_id_str:
                raise TokenInvalidError("Token missing subject claim")
            
            return UUID(user_id_str)
        
        except Exception as e:
            raise TokenInvalidError(f"Cannot extract user ID: {str(e)}")
    
    def extract_jti(self, token: str) -> str:
        """Extract JTI (JWT ID) from a token."""
        try:
            payload = self.decode_token(token, verify=False)
            jti = payload.get("jti")
            
            if not jti:
                raise TokenInvalidError("Token missing JTI claim")
            
            return jti
        
        except Exception as e:
            raise TokenInvalidError(f"Cannot extract JTI: {str(e)}")
    
    def hash_token(self, token: str) -> str:
        """Create a hash of a token for secure storage."""
        return hashlib.sha256(token.encode()).hexdigest()
