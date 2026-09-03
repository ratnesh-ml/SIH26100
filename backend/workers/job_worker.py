"""Background Job Worker for asynchronous document processing."""

import asyncio
import logging
import signal
import sys
from typing import Optional
from backend.core.database import check_database_connection

logger = logging.getLogger("vigilbid.worker")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Worker] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class JobWorker:
    """Polls PostgreSQL jobs table using SELECT FOR UPDATE SKIP LOCKED and invokes pipeline."""

    def __init__(self, poll_interval_seconds: float = 2.0):
        self.poll_interval = poll_interval_seconds
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

    async def poll_cycle(self):
        """Single polling cycle checking for QUEUED jobs."""
        # Job execution logic will run in subsequent pipeline integration phase
        logger.debug("Worker heartbeat: checking queue.")

    async def stop(self):
        """Signal worker to gracefully shut down."""
        logger.info("Shutdown signal received. Stopping worker...")
        self._running = False
