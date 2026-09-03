.PHONY: help install verify test dev-backend dev-frontend worker docker-up docker-down docker-logs clean

help:
	@echo "VigilBid (SIH26100) — Project Automation Commands"
	@echo ""
	@echo "Docker Targets (Single-command deployment):"
	@echo "  make docker-up      Build and start all services (PostgreSQL, Backend, Frontend, Worker)"
	@echo "  make docker-down    Stop and remove all Docker containers and networks"
	@echo "  make docker-logs    Stream logs from all running Docker services"
	@echo ""
	@echo "Local Development Targets:"
	@echo "  make install        Install Python and Frontend dependencies"
	@echo "  make verify         Run repository structural and module import checks"
	@echo "  make test           Run automated test suite via pytest"
	@echo "  make dev-backend    Start FastAPI backend development server (port 8000)"
	@echo "  make dev-frontend   Start Vite frontend development server (port 5173)"
	@echo "  make worker         Start background job worker process"
	@echo "  make clean          Remove __pycache__ and build caches"
	@echo ""

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

install:
	python -m pip install -r requirements.txt
	cd frontend && npm install

verify:
	python scripts/verify_structure.py

test:
	pytest tests/ -v

dev-backend:
	uvicorn backend.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

worker:
	python worker.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
