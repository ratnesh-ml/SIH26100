# PowerShell development task runner for VigilBid on Windows
param (
    [Parameter(Mandatory=$false)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "VigilBid (SIH26100) — Windows PowerShell Development Helper" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Docker Orchestration (Single-command deployment):" -ForegroundColor Yellow
    Write-Host "  .\scripts\dev.ps1 docker-up    - Build and launch all services via Docker Compose"
    Write-Host "  .\scripts\dev.ps1 docker-down  - Stop all running Docker services and remove containers"
    Write-Host "  .\scripts\dev.ps1 docker-logs  - Stream live logs from all Docker containers"
    Write-Host ""
    Write-Host "Local Host Commands (Zero-Docker Development):" -ForegroundColor Yellow
    Write-Host "  .\scripts\dev.ps1 verify       - Run repository structural and import verification"
    Write-Host "  .\scripts\dev.ps1 test         - Run full pytest test suite"
    Write-Host "  .\scripts\dev.ps1 run-backend  - Start FastAPI backend with hot-reload (port 8000)"
    Write-Host "  .\scripts\dev.ps1 run-frontend - Start Vite frontend dev server (port 5173)"
    Write-Host "  .\scripts\dev.ps1 run-worker   - Start asynchronous background pipeline worker"
    Write-Host "  .\scripts\dev.ps1 clean        - Clean cache directories and build artifacts"
    Write-Host "  .\scripts\dev.ps1 help         - Show this help message"
    Write-Host ""
}

switch ($Command.ToLower()) {
    "docker-up" {
        Write-Host "Starting Docker Compose services (Postgres, Backend, Frontend, Worker)..." -ForegroundColor Green
        docker compose up --build -d
    }
    "docker-down" {
        Write-Host "Stopping Docker Compose services..." -ForegroundColor Yellow
        docker compose down
    }
    "docker-logs" {
        docker compose logs -f
    }
    "verify" {
        Write-Host "Running repository verification checks..." -ForegroundColor Yellow
        python scripts/verify_structure.py
    }
    "test" {
        Write-Host "Running pytest test suite..." -ForegroundColor Yellow
        pytest tests/ -v
    }
    "run-backend" {
        Write-Host "Starting FastAPI backend server on http://localhost:8000 ..." -ForegroundColor Green
        uvicorn backend.main:app --reload --port 8000
    }
    "run-frontend" {
        Write-Host "Starting Vite frontend server on http://localhost:5173 ..." -ForegroundColor Green
        Set-Location frontend
        npm run dev
    }
    "run-worker" {
        Write-Host "Starting background pipeline worker..." -ForegroundColor Green
        python worker.py
    }
    "clean" {
        Write-Host "Cleaning cache directories..." -ForegroundColor Yellow
        Get-ChildItem -Path . -Include __pycache__, .pytest_cache -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Write-Host "Clean completed." -ForegroundColor Green
    }
    default {
        Show-Help
    }
}
