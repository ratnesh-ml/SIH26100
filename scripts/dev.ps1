# PowerShell development task runner for VigilBid on Windows
param (
    [Parameter(Mandatory=$false)]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "VigilBid (SIH26100) — Windows PowerShell Development Helper" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\dev.ps1 <command>"
    Write-Host ""
    Write-Host "Available commands:"
    Write-Host "  verify         - Run structural and import verification checks"
    Write-Host "  test           - Run pytest unit and integration tests"
    Write-Host "  run-backend    - Start FastAPI backend with reload (port 8000)"
    Write-Host "  run-frontend   - Start Vite frontend dev server (port 5173)"
    Write-Host "  clean          - Remove __pycache__, .pytest_cache, and temporary files"
    Write-Host "  help           - Show this help message"
}

switch ($Command.ToLower()) {
    "verify" {
        Write-Host "Running repository verification..." -ForegroundColor Yellow
        python scripts/verify_structure.py
    }
    "test" {
        Write-Host "Running test suite..." -ForegroundColor Yellow
        pytest tests/ -v
    }
    "run-backend" {
        Write-Host "Starting FastAPI backend server..." -ForegroundColor Green
        uvicorn backend.main:app --reload --port 8000
    }
    "run-frontend" {
        Write-Host "Starting Vite frontend server..." -ForegroundColor Green
        Set-Location frontend
        npm run dev
    }
    "clean" {
        Write-Host "Cleaning cache directories..." -ForegroundColor Yellow
        Get-ChildItem -Path . -Include __pycache__, .pytest_cache -Recurse -Directory | Remove-Item -Recurse -Force
        Write-Host "Clean completed." -ForegroundColor Green
    }
    default {
        Show-Help
    }
}
