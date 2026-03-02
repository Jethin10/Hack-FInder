# HackHunt App (Production-Oriented Baseline)

This app is now split into:

- `server/` - Express API + SQLite persistence
- `src/` - React + Vite client that consumes the API
- `shared/` - typed API contracts shared by frontend and backend
- `ingestion/` - Python ingestion pipeline (Devpost, Devfolio, HackerEarth, Unstop, MLH + normalization + geocoding)

## What Changed from Prototype v1

- Replaced frontend-only mock data flow with a real API: `GET /api/hackathons`
- Added persistent data storage using `better-sqlite3` (`data/hackhunt.db`)
- Added schema initialization and deterministic seed bootstrap on API start
- Moved filtering logic server-side (format mix, radius, timeline, themes, prizes, organizer history, search, sorting)
- Added API health endpoint: `GET /api/health`
- Frontend now handles loading/error states and consumes filter facets from API
- Added command-palette query parsing for practical natural language shortcuts
- Added skill-tailored ranking with visible match score (`Tailor to my skills`)
- Added Medo Copilot API integration: `POST /api/medo/copilot` with structured project-plan output
- Added live multi-source ingestion pipeline (`python scripts/run_ingestion.py`) to fetch open hackathons from Devpost, Devfolio, HackerEarth, Unstop, and MLH and upsert SQLite
- Added ingestion JSON bootstrap support (`data/ingested_hackathons.json`) loaded by API startup when present

## Local Development

Prerequisites:

- Node.js 20+
- npm

Steps:

1. Install deps
   - `npm install`
2. Copy `.env.example` to `.env.local` (or set env vars another way)
3. Start full stack (API + frontend)
   - `npm run dev`
4. Open `http://localhost:3000`

## Scripts

- `npm run dev` - runs API and web app together
- `npm run dev:api` - API only (`http://localhost:8787`)
- `npm run dev:web` - frontend only (`http://localhost:3000`)
- `npm run start:api` - start API without watch mode
- `npm run ingest` - run ingestion pipeline (writes SQLite + JSON)
- `npm run test:ingestion` - run ingestion unit tests
- `npm run lint` - type-check frontend + backend
- `npm run build` - production frontend build

## Environment Variables

- `HACKHUNT_DB_PATH` - SQLite file path (default `./data/hackhunt.db`)
- `HACKHUNT_FORCE_SEED` - `true` to wipe + reseed at startup
- `HACKHUNT_ALLOWED_ORIGIN` - CORS allowlist origin (`*` by default)
- `VITE_API_BASE_URL` - optional absolute API host for frontend
- `VITE_API_PROXY_TARGET` - Vite dev proxy target (`http://localhost:8787` default)
- `HACKHUNT_INGESTED_JSON_PATH` - optional custom path for ingestion JSON bootstrap file
- `HACKHUNT_INGEST_MAX_PAGES` - number of pages to ingest for paginated sources (Devpost, Unstop)
- `HACKHUNT_INGEST_SOURCES` - comma-separated source list (`devpost,devfolio,hackerearth,unstop,mlh`)
- `HACKHUNT_MLH_SEASON_YEAR` - optional MLH season year override (defaults to current UTC year)
- `HACKHUNT_DISABLE_GEOCODING` - `true` to skip geocoding external lookups
- `MEDO_API_URL` - Medo endpoint URL for copilot generation
- `MEDO_API_KEY` - Medo API bearer token
- `MEDO_API_TIMEOUT_MS` - request timeout for Medo calls (default `10000`)

## Medo Copilot

The dashboard includes a per-row `Copilot` action that calls the backend endpoint:

- `POST /api/medo/copilot`

Request inputs include hackathon context, user skills, goal, and constraints. The response is a structured execution plan with:

- project pitch and problem framing
- architecture and build plan
- judging-criteria alignment
- submission checklist and demo script

If Medo configuration is missing or the upstream call fails, the API returns a deterministic fallback plan so the UI remains usable during demos.

## Ingestion Pipeline

Run from `app/`:

1. Ingest from all supported sources into both SQLite and JSON bootstrap:
   - `npm run ingest`
2. Optional flags (direct Python):
   - `python scripts/run_ingestion.py --max-pages 3 --skip-db --sources devpost,devfolio,unstop`
   - `python scripts/run_ingestion.py --mlh-season-year 2026`
   - `python scripts/run_ingestion.py --disable-geocoding`

Output defaults:

- SQLite: `app/data/hackhunt.db`
- JSON: `app/data/ingested_hackathons.json`

GitHub Actions workflow:

- `.github/workflows/ingest-hackathons.yml` (runs every 12 hours + manual dispatch)

## Current Scope

This is now a functional PRD-aligned MVP with live multi-source ingestion, server-side filtering, and command-palette-driven search.

Remaining milestones:

- Upgrade geospatial backend to Supabase/PostGIS for larger scale
- Add alerts/notifications and broader reliability coverage in CI
