"""VigilBid FastAPI Application Factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import check_database_connection
from backend.api.router import api_router


def create_app() -> FastAPI:
    """Instantiate and configure the FastAPI application."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
    )

    # CORS configuration
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health Check (Public)
    @application.get("/health", tags=["Health"])
    async def health_check():
        """Public health check endpoint validating system and database status."""
        db_health = await check_database_connection()
        is_healthy = db_health["connected"]
        
        return {
            "status": "healthy" if is_healthy else "degraded",
            "project": settings.PROJECT_NAME,
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "components": {
                "database": {
                    "status": "connected" if db_health["connected"] else "disconnected",
                    "dialect": db_health["dialect"],
                    "latency_ms": db_health["latency_ms"],
                    "error": db_health["error"],
                },
                "ocr": settings.PRIMARY_OCR,
                "llm": "enabled" if settings.LLM_ENABLED else "disabled",
            },
        }

    # Mount API v1 router
    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application


app = create_app()
