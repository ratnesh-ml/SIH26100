"""Background Job Worker for asynchronous document processing."""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class JobWorker:
    """Polls PostgreSQL jobs table using SELECT FOR UPDATE SKIP LOCKED and invokes pipeline."""

    def __init__(self, poll_interval_seconds: float = 2.0):
        self.poll_interval = poll_interval_seconds
        self._running = False

    async def start(self):
        """Start worker polling loop."""
        self._running = True
        logger.info("JobWorker polling loop initialized.")
        # Worker execution logic will run in Phase 04

    async def stop(self):
        """Gracefully stop worker."""
        self._running = False
        logger.info("JobWorker stopped.")
