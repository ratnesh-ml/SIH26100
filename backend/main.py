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

    # CORS configuration - explicit origins to prevent credential leakage
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Security Response Headers Middleware (OWASP Defense-in-Depth)
    @application.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob:; "
            "style-src 'self' 'unsafe-inline'; "
            "frame-ancestors 'none';"
        )
        return response

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

    # Mount static frontend SPA if prebuilt (enables single-port zero-npm demo)
    from pathlib import Path
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if frontend_dist.exists() and (frontend_dist / "index.html").exists():
        from fastapi.staticfiles import StaticFiles
        application.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

    return application


app = create_app()
