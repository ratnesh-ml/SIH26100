"""JWT authentication verification and dependency helpers."""

from typing import Optional
from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: Optional[int] = None
    iat: Optional[int] = None
