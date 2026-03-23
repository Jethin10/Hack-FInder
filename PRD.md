# 📄 Product Requirements Document (PRD)

**Project Name:** HackHunt (Working Title)  
**Document Status:** V2 (Updated with Geospatial & Proximity Logic)  
**Project Type:** Personal Passion Project / Utility Tool  
**Target Platform:** Web Application (Responsive Desktop-First)

---

## 1. Overview

**The Problem:** Finding the right hackathon is currently a fragmented and frustrating experience. Platforms like Devpost, Devfolio, MLH, and HackerEarth silo their data and have rigid, basic filtering. They fail to tell a developer the true time commitment (from registration to final submission) and lack intelligent location filtering for hybrid or local offline events.

**The Solution:** A centralized, automated aggregator web app that pulls hackathons from across the internet into a single, highly-filterable, developer-centric dashboard. It focuses on granular timeline data (finding events starting in 2-3 days), exact commitment times, and a powerful mix-and-match geographic filter allowing users to browse global online events alongside local offline events simultaneously.

---

## 2. Target Audience & Design Philosophy

- **Primary User:** Developers looking for quick weekend sprints, last-minute hackathons, or highly specific local/online events.
- **Design Philosophy:** "Developer-First." Minimalist, data-dense, and highly functional. No marketing fluff, no mandatory logins, and no bloated images. Just fast, filterable data.
- **Default Theme:** Dark Mode.

---

## 3. Core Features & "Killer" Filters

The platform must support filtering and sorting by the following unique parameters:

### Smart Location & Proximity Logic (Mix & Match)

- Users can select **Online**, **Offline**, or **both simultaneously**.
- **Radius Proximity:** When Offline is selected, users can set a base location (e.g., "Delhi NCR") and a radius slider (e.g., 50km).
- **Mixed Feed:** The app will seamlessly populate a feed matching: `[All Online Events Globally]` + `[Offline Events specifically within 50km of Delhi NCR]`, completely filtering out irrelevant offline events (like those in Chennai or Bangalore).

### Time to Final Stage (The Unique Value Prop)

A filter that calculates the exact number of days from registration/start to the final pitch/submission (e.g., `< 3 Days`, `1 Week`, `1 Month+`).

### Start Proximity

- "Happening Now"
- "Starting in < 48 Hours"
- "Next Week"

### Themes/Tags

Web3, AI/ML, Open Source, Healthcare, Beginner-friendly, etc.

### Organizer History

A visual indicator showing if the organizer has a track record (e.g., "Hosted 3+ past events" vs. "First-time organizer").

### Prizes

Simple tags for **Cash**, **Swag**, **Job/Internship**, or **Unspecified**.

---

## 4. User Experience (UX) Components

- **Data-Grid / Linear-Style Interface:** A dense table or Kanban board layout. Columns include: `Event Name` | `Format` | `Start Date` | `Days to Final Stage` | `Location/Distance` | `Theme` | `Direct Link`.
- **Command Palette:** Pressing `Cmd + K` (or `Ctrl + K`) opens a global search bar to type natural queries like *"Offline AI hackathons near Delhi next weekend"*.
- **Direct Navigation:** 1-click out to the original hackathon registration page.

---

## 5. Technical Architecture (The $0 Tech Stack)

To fulfill the requirement of zero operating costs, the app relies on free-tier services and automated pipelines.

| Layer                        | Technology                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Data Sourcing (Scraping)** | Python (BeautifulSoup for static HTML, Playwright for dynamic JS sites like Devfolio) |
| **Geocoding Engine**         | Python `geopy` library (using free OpenStreetMap/Nominatim data) to convert scraped text locations into exact Lat/Lng coordinates |
| **AI Data Parser**           | Google Gemini API (Free Tier) — scraper grabs raw "Timeline/Schedule" text and sends to Gemini with a strict prompt: *"Return a JSON with registration_deadline, final_submission_date, and total_days_commitment."* |
| **Automation Pipeline**      | GitHub Actions — a `.yml` workflow triggers the Python scraper and geocoder scripts every 12–24 hours |
| **Database & Geospatial**    | Supabase (Free Tier) — serverless PostgreSQL with PostGIS extension for radius distance calculations |
| **Frontend Web App**         | Next.js (or React) + TailwindCSS                                          |
| **Hosting**                  | Vercel (Free Tier)                                                         |

---

## 6. Data Schema Design (High Level)

The Supabase database will have a main `hackathons` table structured roughly like this:

| Column                  | Type                | Description                                         |
| ----------------------- | ------------------- | --------------------------------------------------- |
| `id`                    | UUID, Primary Key   | Unique identifier                                   |
| `title`                 | String              | Hackathon name                                      |
| `url`                   | String              | Direct link to registration                         |
| `source_platform`       | String              | e.g., 'Devpost', 'Devfolio'                         |
| `format`                | Enum                | 'Online', 'Offline', 'Hybrid'                       |
| `location_text`         | String              | Scraped raw text, e.g., "Gurugram, Haryana"         |
| `coordinates`           | Geography/Point     | Lat/Lng used for PostGIS distance math               |
| `start_date`            | DateTime            | Event start date                                    |
| `final_submission_date` | DateTime            | Final submission/pitch date                         |
| `days_to_final`         | Integer             | Calculated via AI                                   |
| `themes`                | Array of Strings    | Tags like AI/ML, Web3, etc.                         |
| `organizer_past_events` | Integer             | Number of past events by organizer                  |
| `created_at`            | Timestamp           | When the record was scraped                         |

---

## 7. Implementation Roadmap

### Phase 1: The Engine (Scraping, AI Parsing & Geocoding)

- [ ] Write a web scraper targeting one primary site (e.g., Devfolio).
- [ ] Integrate the Google Gemini API to parse timelines into strict JSON (Days to Final Stage).
- [ ] Integrate `geopy` to convert offline location text into Lat/Lng coordinates.

### Phase 2: Database & Automation

- [ ] Set up a free Supabase project and enable the PostGIS extension.
- [ ] Create the PostgreSQL tables and get connection credentials.
- [ ] Write a database function (RPC) to handle the "Online OR (Offline within X km)" query.
- [ ] Update the Python script to UPSERT data into Supabase.
- [ ] Set up a GitHub Actions workflow to run the script nightly.

### Phase 3: The Web Interface

- [ ] Initialize a Next.js project with TailwindCSS.
- [ ] Connect the Next.js app to Supabase.
- [ ] Build the core Table/Grid UI.
- [ ] Implement the filters: Format, Dates, Days to Final.
- [ ] Implement the Proximity Filter: Add a "My Location" input and "Radius" slider that triggers the PostGIS database query.
- [ ] Implement the `Cmd+K` command palette.

### Phase 4: Expansion & Polish

- [ ] Add additional scraping scripts for other platforms (HackerEarth, MLH, Unstop).
- [ ] Refine the UI/UX based on personal usage.
- [ ] Deploy the frontend to Vercel.

---

## 8. Future Considerations (Post-MVP)

- **Automated Alerts:** Using a free email tier (like Resend) or Telegram Bot API to notify you the second an offline hackathon in the Delhi NCR region is announced.
- **Open Source:** Open-sourcing the project so other developers can contribute web scrapers for niche/local hackathon websites.

---

## 9. Implementation Status Addendum (2026-03-01)

- [x] Core dashboard, filters, and command palette are implemented in `app/src`.
- [x] Mixed online/offline/hybrid feed with proximity logic is implemented server-side in `app/server/hackathonService.ts`.
- [x] Organizer history visual states now distinguish trusted, returning, and first-time organizers.
- [x] Live multi-source ingestion pipeline is implemented in `app/ingestion` and `app/scripts/run_ingestion.py`.
- [x] Ingestion writes both SQLite data and `app/data/ingested_hackathons.json`, and API startup can bootstrap from that JSON.
- [x] Scheduled ingestion automation added via `.github/workflows/ingest-hackathons.yml`.
- [x] Additional source connectors are implemented for Devfolio, MLH, HackerEarth, and Unstop.
- [ ] Supabase/PostGIS migration remains pending.
