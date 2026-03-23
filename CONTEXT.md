# HackHunt Project Context

Last updated: 2026-02-28

## 1. What This Project Is

HackHunt is a developer-first hackathon aggregator. The product goal from `PRD.md` is to unify hackathons from multiple sources and make them filterable by:

- format mix (online + offline/hybrid together)
- proximity radius for local events
- timeline urgency (start soon, happening now)
- days to final submission
- themes, prizes, organizer history

## 2. Current State (Code Reality)

The app is now a production-oriented baseline, not just a frontend mock prototype.

### Current architecture

- Frontend: React + Vite + Tailwind (`app/src`)
- API: Express (`app/server/index.ts`)
- Storage: SQLite via `better-sqlite3` (`app/server/db.ts`)
- Shared types/contracts between frontend/backend (`app/shared/contracts.ts`)

### Implemented backend behavior

- `GET /api/health`
- `GET /api/hackathons` with server-side filtering:
  - include online/offline/hybrid
  - proximity with base coordinates + radius
  - time-to-final buckets
  - start proximity buckets
  - themes, prizes
  - organizer history
  - search query
  - sorting + pagination inputs

### Implemented frontend behavior

- Sidebar filters wired to live API calls
- Command palette (`Cmd/Ctrl + K`) with practical query parsing shortcuts
- Data grid with:
  - trusted organizer badge
  - distance display (when location filter is active)
  - loading and error states
- No frontend mock data dependency anymore

## 3. What Was Completed Recently

- Removed old mock-only flow and moved filtering logic to API.
- Added database schema setup + deterministic seed data bootstrap.
- Added env-based configuration for API and frontend integration.
- Updated local development scripts to run API and web app together.

## 4. PRD Gap Status

Status key:

- `DONE`: implemented in codebase
- `PARTIAL`: present but not production-final
- `NOT STARTED`: not yet implemented

### Core UX and filtering

- Mixed format filtering (online/offline/hybrid): `DONE`
- Radius proximity (manual base location list + slider): `PARTIAL`
- Days to final stage filter: `DONE`
- Start proximity filter: `DONE`
- Themes/tags filter: `DONE`
- Organizer history signal/filter: `DONE`
- Prize categories filter: `DONE`
- Command palette: `PARTIAL` (rule-based parsing, not full natural language understanding)
- Dense data grid UI + direct outbound links: `DONE`

### Data platform and ingestion

- Real scraping from sources (Devpost/Devfolio/MLH/etc.): `NOT STARTED`
- AI timeline parser (Gemini extraction pipeline): `NOT STARTED`
- Geocoding from raw location text: `NOT STARTED`
- Scheduled ingestion automation (GitHub Actions): `NOT STARTED`
- Supabase + PostGIS production geospatial DB: `NOT STARTED`

### Platform hardening

- Authentication: not required for MVP
- Observability/logging/metrics: `NOT STARTED`
- Automated tests (unit/integration/e2e): `NOT STARTED`
- CI for lint/test/build: `NOT STARTED`
- Deployment (Vercel/API hosting): `NOT STARTED`

## 5. What Is Left (Priority Order)

### P0 - Make data real

1. Build scraper pipeline for one source first (Devfolio or Devpost).
2. Add timeline parsing to derive `final_submission_date` + `days_to_final`.
3. Add geocoding of offline/hybrid locations to lat/lng.
4. Replace or augment seed data with ingested records.

### P1 - Move to PRD target stack

1. Set up Supabase Postgres + PostGIS.
2. Port SQLite schema to Supabase schema.
3. Add radius query RPC for scalable geospatial filtering.
4. Update API data layer to read/write Supabase.

### P2 - Reliability and release readiness

1. Add tests for query parsing and filter correctness.
2. Add API integration tests for `/api/hackathons`.
3. Add CI pipeline for lint/test/build.
4. Deploy frontend + API and configure environment/secrets.

### P3 - Product expansion

1. Add more source connectors (HackerEarth, MLH, Unstop).
2. Add alerting (email/Telegram) for high-priority matches.
3. Improve command palette to robust natural-language intent parsing.

## 6. Quick Runbook

From `app/`:

1. `npm install`
2. `npm run dev`
3. Frontend: `http://localhost:3000`
4. API health: `http://localhost:8787/api/health`

Important env vars (`app/.env.example`):

- `HACKHUNT_DB_PATH`
- `HACKHUNT_FORCE_SEED`
- `HACKHUNT_ALLOWED_ORIGIN`
- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`

## 7. Source of Truth Files

- Product intent: `PRD.md`
- Current implementation details: `app/README.md`
- API entrypoint: `app/server/index.ts`
- Filtering logic: `app/server/hackathonService.ts`
- Frontend app shell: `app/src/App.tsx`
