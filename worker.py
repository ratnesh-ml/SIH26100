"""Top-level entrypoint for VigilBid background worker process."""

import asyncio
import sys
from backend.workers.job_worker import JobWorker


async def main():
    worker = JobWorker(poll_interval_seconds=2.0)
    try:
        await worker.start()
    except KeyboardInterrupt:
        print("\nStopping worker gracefully...")
        await worker.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
