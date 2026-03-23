# HackHunt App Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete remaining PRD-critical app features by adding real ingestion, stronger command/query UX, and verification coverage.

**Architecture:** Keep the existing React + Express + SQLite runtime and add a Python ingestion pipeline that fetches live Devpost data, normalizes fields, geocodes offline locations, and upserts records into SQLite. Frontend/API behavior stays contract-compatible while command parsing and organizer-status UX are strengthened.

**Tech Stack:** React 19, TypeScript, Express, SQLite, Python 3 (stdlib + optional Gemini/geocoding integrations).

---

### Task 1: Add failing tests for ingestion timeline + normalization contracts

**Files:**
- Create: `app/ingestion/tests/test_timeline_parser.py`
- Create: `app/ingestion/tests/test_transformers.py`
- Test: `python -m unittest discover app/ingestion/tests`

### Task 2: Implement ingestion modules

**Files:**
- Create: `app/ingestion/__init__.py`
- Create: `app/ingestion/connectors/__init__.py`
- Create: `app/ingestion/connectors/devpost.py`
- Create: `app/ingestion/timeline_parser.py`
- Create: `app/ingestion/geocoding.py`
- Create: `app/ingestion/transformers.py`
- Create: `app/ingestion/pipeline.py`

### Task 3: Wire ingestion outputs to runtime data

**Files:**
- Create: `app/scripts/run_ingestion.py`
- Modify: `app/server/db.ts`

### Task 4: Improve command palette parsing + organizer UX

**Files:**
- Modify: `app/src/utils/commandParser.ts`
- Modify: `app/src/components/DataGrid.tsx`
- Modify: `app/src/components/Sidebar.tsx`

### Task 5: Add automation + docs

**Files:**
- Create: `.github/workflows/ingest-hackathons.yml`
- Modify: `app/README.md`
- Modify: `PRD.md` (implementation status addendum)
