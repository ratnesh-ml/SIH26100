"""Application Configuration for VigilBid."""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load .env if present
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "VigilBid (SIH26100)"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    SECRET_KEY: str = Field(default_factory=lambda: os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-64chars-min"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # Database
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", 
            "postgresql+asyncpg://postgres:postgres@localhost:5432/vigilbid"
        )
    )
    DATABASE_SYNC_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_SYNC_URL", 
            "postgresql://postgres:postgres@localhost:5432/vigilbid"
        )
    )
    
    # Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("STORAGE_DIR", str(Path(__file__).resolve().parent.parent.parent / "data" / "storage")))
    )
    
    # Security
    FERNET_KEY: str = Field(default_factory=lambda: os.getenv("FERNET_KEY", "uE_3m_9sF9yKz6T-Yh1N9P0wZ7vL5k4j2h1g8f7e6d4="))
    
    # Pipeline & OCR
    PRIMARY_OCR: str = Field(default_factory=lambda: os.getenv("PRIMARY_OCR", "paddleocr"))
    FALLBACK_OCR: str = Field(default_factory=lambda: os.getenv("FALLBACK_OCR", "tesseract"))
    
    # Copilot & LLM
    LLM_ENABLED: bool = Field(default_factory=lambda: os.getenv("LLM_ENABLED", "false").lower() == "true")
    LLM_PROVIDER: str = Field(default_factory=lambda: os.getenv("LLM_PROVIDER", "ollama"))


settings = Settings()
