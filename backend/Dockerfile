FROM python:3.12-slim

WORKDIR /app

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY pipeline/ ./pipeline/
COPY rules/ ./rules/
COPY seed/ ./seed/
COPY data/ ./data/
COPY worker.py ./worker.py

EXPOSE 8000

# Default command: FastAPI API server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
