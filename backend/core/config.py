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
    
    # Security & Secrets
    FERNET_KEY: str = Field(default_factory=lambda: os.getenv("FERNET_KEY", "uE_3m_9sF9yKz6T-Yh1N9P0wZ7vL5k4j2h1g8f7e6d4="))
    
    # CORS Allowed Origins
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "BACKEND_CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://127.0.0.1:8000",
            ).split(",")
            if origin.strip()
        ]
    )

    # Pipeline & OCR
    PRIMARY_OCR: str = Field(default_factory=lambda: os.getenv("PRIMARY_OCR", "paddleocr"))
    FALLBACK_OCR: str = Field(default_factory=lambda: os.getenv("FALLBACK_OCR", "tesseract"))
    
    # Copilot & LLM
    LLM_ENABLED: bool = Field(default_factory=lambda: os.getenv("LLM_ENABLED", "false").lower() == "true")
    LLM_PROVIDER: str = Field(default_factory=lambda: os.getenv("LLM_PROVIDER", "ollama"))

    def validate_production_secrets(self) -> None:
        """Enforce strong non-default secrets when running in production."""
        if self.ENVIRONMENT.lower() in ("production", "prod"):
            if "dev-secret-key" in self.SECRET_KEY or len(self.SECRET_KEY) < 32:
                raise ValueError("CRITICAL: Default or weak SECRET_KEY cannot be used in production!")
            if self.FERNET_KEY == "uE_3m_9sF9yKz6T-Yh1N9P0wZ7vL5k4j2h1g8f7e6d4=":
                raise ValueError("CRITICAL: Default FERNET_KEY cannot be used in production!")


settings = Settings()
settings.validate_production_secrets()
