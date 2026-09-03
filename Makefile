.PHONY: help install verify test dev-backend dev-frontend clean

help:
	@echo "VigilBid (SIH26100) — Project Automation Commands"
	@echo ""
	@echo "Targets:"
	@echo "  make install        Install Python and Frontend dependencies"
	@echo "  make verify         Run repository structural and module import checks"
	@echo "  make test           Run automated test suite via pytest"
	@echo "  make dev-backend    Start FastAPI backend development server"
	@echo "  make dev-frontend   Start Vite frontend development server"
	@echo "  make clean          Remove __pycache__ and build caches"
	@echo ""

install:
	python -m pip install -r requirements.txt || true
	cd frontend && npm install

verify:
	python scripts/verify_structure.py

test:
	pytest tests/ -v

dev-backend:
	uvicorn backend.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
