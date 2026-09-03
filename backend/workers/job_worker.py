"""Background Job Worker for asynchronous document processing and OCR pipeline execution."""

import asyncio
import logging
from pathlib import Path
import signal
import sys
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from backend.core.database import check_database_connection, get_session_maker
from backend.models.entities import Job
from backend.services.job_service import JobService

logger = logging.getLogger("vigilbid.worker")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Worker] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class JobWorker:
    """Polls PostgreSQL jobs table using SELECT FOR UPDATE SKIP LOCKED and executes OCR pipeline."""

    def __init__(
        self,
        poll_interval_seconds: float = 2.0,
        session_maker: Optional[async_sessionmaker[AsyncSession]] = None,
        job_service: Optional[JobService] = None,
    ):
        self.poll_interval = poll_interval_seconds
        self.session_maker = session_maker or get_session_maker()
        self.job_service = job_service or JobService()
        self._running = False

    async def check_readiness(self) -> bool:
        """Verify database connectivity before starting worker loop."""
        db_status = await check_database_connection()
        if db_status["connected"]:
            logger.info("Database connected successfully. Dialect: %s (latency: %sms)", 
                        db_status["dialect"], db_status["latency_ms"])
            return True
        else:
            logger.warning("Database not reachable yet: %s. Worker will retry...", db_status["error"])
            return False

    async def start(self):
        """Start worker polling loop."""
        self._running = True
        logger.info("VigilBid Pipeline Worker starting up...")

        # Setup graceful shutdown handlers (where supported)
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, lambda: asyncio.create_task(self.stop()))
            except (NotImplementedError, RuntimeError):
                # Windows event loop doesn't support add_signal_handler
                pass

        # Check DB readiness
        await self.check_readiness()

        logger.info("Worker polling loop active (interval: %.1fs). Awaiting jobs...", self.poll_interval)
        try:
            while self._running:
                await self.poll_cycle()
                await asyncio.sleep(self.poll_interval)
        except asyncio.CancelledError:
            logger.info("Worker task cancelled.")
        finally:
            logger.info("Worker loop terminated cleanly.")

    async def poll_cycle(self) -> Optional[Job]:
        """Single polling cycle: claims next QUEUED job and executes the full 11-step pipeline."""
        try:
            async with self.session_maker() as session:
                job = await self.job_service.claim_next_job(session)
                if job:
                    logger.info("Worker claimed Job %s for Bidder %s. Executing full pipeline...", job.id, job.bidder_id)
                    processed_job = await self.job_service.process_job_full_pipeline(session, job.id)
                    logger.info("Worker finished Job %s with status: %s", processed_job.id, processed_job.status)
                    return processed_job
        except Exception as exc:
            logger.error("Error during worker poll cycle: %s", exc, exc_info=True)
        return None

    async def process_single_job(self, job_id: uuid.UUID) -> Job:
        """Process a specific job directly by ID without waiting for the polling loop."""
        async with self.session_maker() as session:
            return await self.job_service.process_job_full_pipeline(session, job_id)

    async def stop(self):
        """Signal worker to gracefully shut down."""
        logger.info("Shutdown signal received. Stopping worker...")
        self._running = False
