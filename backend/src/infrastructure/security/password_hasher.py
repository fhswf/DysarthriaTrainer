from typing import Final
"""
Password hashing implementation using passlib with bcrypt.
"""

from passlib.context import CryptContext

from src.core.ports.password_hasher import IPasswordHasher


class BcryptPasswordHasher(IPasswordHasher):
    """Password hashing using bcrypt via passlib."""
    
    def __init__(self):
        self._pwd_context: Final[CryptContext] = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=12,  # Work factor
        )

    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return self._pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash."""
        return self._pwd_context.verify(plain_password, hashed_password)
    
    def needs_rehash(self, hashed_password: str) -> bool:
        """Check if a hashed password needs to be rehashed."""
        return self._pwd_context.needs_update(hashed_password)
