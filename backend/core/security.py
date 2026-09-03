"""Security, hashing, and token utilities for VigilBid."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import jwt
from cryptography.fernet import Fernet
from backend.core.config import settings

ALGORITHM = "HS256"


def create_access_token(subject: str | Any, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


def get_fernet_cipher() -> Fernet:
    """Return Fernet cipher for identifier encryption (PAN/GSTIN)."""
    return Fernet(settings.FERNET_KEY.encode() if isinstance(settings.FERNET_KEY, str) else settings.FERNET_KEY)


def encrypt_identifier(value: str) -> bytes:
    """Encrypt sensitive identifier (PAN/GSTIN) at rest."""
    cipher = get_fernet_cipher()
    return cipher.encrypt(value.encode())


def decrypt_identifier(token: bytes) -> str:
    """Decrypt sensitive identifier at rest."""
    cipher = get_fernet_cipher()
    return cipher.decrypt(token).decode()


def get_password_hash(password: str) -> str:
    """Hash a plaintext password using PBKDF2-HMAC-SHA256 with a unique salt."""
    import secrets
    import hashlib
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:sha256:100000${salt}${hashed.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against PBKDF2 hash."""
    import hashlib
    import hmac
    try:
        algorithm, salt, hash_hex = hashed_password.split("$")
        calculated = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return hmac.compare_digest(calculated.hex(), hash_hex)
    except Exception:
        return False
