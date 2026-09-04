# Legacy UI Prototype (Archived)

**Archive Date:** September 2026  
**Artifacts Contained:** `index.html`, `css/style.css`, `js/main.js`  
**Status:** Deprecated / Non-Runtime  

---

## 1. What Were These Files?
During the initial research and phase-0 scoping of the hackathon, these three files provided an offline, browser-based Markdown reader using marked.js to inspect early research documentation (`00-research-audit.md` through `06-demo-...`).

## 2. Why Were They Archived?
As the application matured, the actual production web interface was fully built and deployed as a modern Single Page Application under `frontend/` (React 18 + Vite + TypeScript + Tailwind CSS). 

Leaving loose `index.html`, `css/`, and `js/` folders at the repository root caused newcomer confusion, as developers cloning the repository mistook them for the primary web application.

## 3. Are They Safe to Delete Later?
**Yes.** Neither the FastAPI backend, the Vite frontend build, the background worker, nor the automated pytest/vitest test suites depend on these files. They are preserved in `archive/legacy-ui/` solely for historical provenance and project evolution records.
