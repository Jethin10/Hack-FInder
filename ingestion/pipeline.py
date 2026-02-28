from __future__ import annotations

import argparse
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

from app.ingestion.connectors.devfolio import fetch_devfolio_hackathons
from app.ingestion.connectors.devpost import fetch_devpost_hackathons
from app.ingestion.connectors.hackerearth import fetch_hackerearth_hackathons
from app.ingestion.connectors.mlh import fetch_mlh_hackathons
from app.ingestion.connectors.unstop import fetch_unstop_hackathons
from app.ingestion.geocoding import LocationGeocoder
from app.ingestion.transformers import (
    normalize_devfolio_hackathons,
    normalize_devpost_hackathons,
    normalize_hackerearth_hackathons,
    normalize_mlh_hackathons,
    normalize_unstop_hackathons,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = REPO_ROOT / "app" / "data" / "hackhunt.db"
DEFAULT_JSON_OUTPUT_PATH = REPO_ROOT / "app" / "data" / "ingested_hackathons.json"
SUPPORTED_SOURCES = ("devpost", "devfolio", "hackerearth", "unstop", "mlh")
SOURCE_PLATFORM_BY_KEY = {
    "devpost": "Devpost",
    "devfolio": "Devfolio",
    "hackerearth": "HackerEarth",
    "unstop": "Unstop",
    "mlh": "MLH",
}


def _ensure_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS hackathons (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          source_platform TEXT NOT NULL,
          format TEXT NOT NULL CHECK (format IN ('Online', 'Offline', 'Hybrid')),
          location_text TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          start_date TEXT NOT NULL,
          final_submission_date TEXT NOT NULL,
          days_to_final INTEGER NOT NULL CHECK (days_to_final >= 0),
          themes TEXT NOT NULL,
          organizer_past_events INTEGER NOT NULL DEFAULT 0,
          prizes TEXT NOT NULL,
          created_at TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_hackathons_format ON hackathons(format);
        CREATE INDEX IF NOT EXISTS idx_hackathons_start_date ON hackathons(start_date);
        CREATE INDEX IF NOT EXISTS idx_hackathons_days_to_final ON hackathons(days_to_final);
        CREATE INDEX IF NOT EXISTS idx_hackathons_created_at ON hackathons(created_at);
        """
    )


def _upsert_records(connection: sqlite3.Connection, records: Iterable[Dict[str, object]]) -> int:
    statement = """
      INSERT INTO hackathons (
        id,
        title,
        url,
        source_platform,
        format,
        location_text,
        latitude,
        longitude,
        start_date,
        final_submission_date,
        days_to_final,
        themes,
        organizer_past_events,
        prizes,
        created_at,
        is_active
      ) VALUES (
        :id,
        :title,
        :url,
        :source_platform,
        :format,
        :location_text,
        :latitude,
        :longitude,
        :start_date,
        :final_submission_date,
        :days_to_final,
        :themes,
        :organizer_past_events,
        :prizes,
        :created_at,
        1
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        url = excluded.url,
        source_platform = excluded.source_platform,
        format = excluded.format,
        location_text = excluded.location_text,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        start_date = excluded.start_date,
        final_submission_date = excluded.final_submission_date,
        days_to_final = excluded.days_to_final,
        themes = excluded.themes,
        organizer_past_events = excluded.organizer_past_events,
        prizes = excluded.prizes,
        created_at = excluded.created_at,
        is_active = 1;
    """
    cursor = connection.cursor()
    rows_written = 0
    for record in records:
        cursor.execute(
            statement,
            {
                "id": record["id"],
                "title": record["title"],
                "url": record["url"],
                "source_platform": record["source_platform"],
                "format": record["format"],
                "location_text": record["location_text"],
                "latitude": record.get("latitude"),
                "longitude": record.get("longitude"),
                "start_date": record["start_date"],
                "final_submission_date": record["final_submission_date"],
                "days_to_final": int(record["days_to_final"]),
                "themes": json.dumps(record.get("themes", [])),
                "organizer_past_events": int(record.get("organizer_past_events", 0)),
                "prizes": json.dumps(record.get("prizes", [])),
                "created_at": record["created_at"],
            },
        )
        rows_written += 1
    connection.commit()
    return rows_written


def _serialize_for_json(records: Iterable[Dict[str, object]]) -> List[Dict[str, object]]:
    serialized: List[Dict[str, object]] = []
    for record in records:
        serialized.append(
            {
                "id": record["id"],
                "title": record["title"],
                "url": record["url"],
                "sourcePlatform": record["source_platform"],
                "format": record["format"],
                "locationText": record["location_text"],
                "coordinates": (
                    {
                        "lat": record["latitude"],
                        "lng": record["longitude"],
                    }
                    if record.get("latitude") is not None
                    and record.get("longitude") is not None
                    else None
                ),
                "startDate": record["start_date"],
                "finalSubmissionDate": record["final_submission_date"],
                "daysToFinal": record["days_to_final"],
                "themes": record.get("themes", []),
                "organizerPastEvents": record.get("organizer_past_events", 0),
                "prizes": record.get("prizes", []),
                "createdAt": record["created_at"],
            }
        )
    return serialized


def _apply_geocoding(records: List[Dict[str, object]], enabled: bool) -> None:
    if not enabled:
        return

    geocoder = LocationGeocoder(enabled=True)
    for record in records:
        format_value = str(record.get("format") or "")
        if format_value == "Online":
            continue
        coordinates = geocoder.geocode(str(record.get("location_text") or ""))
        if coordinates is None:
            continue
        record["latitude"] = coordinates[0]
        record["longitude"] = coordinates[1]


def _dedupe_by_id(records: List[Dict[str, object]]) -> List[Dict[str, object]]:
    by_id: Dict[str, Dict[str, object]] = {}
    for record in records:
        identifier = str(record.get("id") or "")
        if not identifier:
            continue
        by_id[identifier] = record
    return list(by_id.values())


def _deactivate_stale_records(
    connection: sqlite3.Connection,
    records: Sequence[Dict[str, object]],
    selected_sources: Sequence[str],
) -> int:
    selected_platforms = {
        SOURCE_PLATFORM_BY_KEY[source]
        for source in selected_sources
        if source in SOURCE_PLATFORM_BY_KEY
    }
    if len(selected_platforms) == 0:
        return 0

    active_platforms_in_run = {
        str(record.get("source_platform") or "").strip()
        for record in records
        if str(record.get("source_platform") or "").strip()
    }
    target_platforms = sorted(selected_platforms & active_platforms_in_run)
    if len(target_platforms) == 0:
        return 0

    active_ids = sorted(
        {
            str(record.get("id") or "").strip()
            for record in records
            if str(record.get("id") or "").strip()
            and str(record.get("source_platform") or "").strip() in target_platforms
        }
    )
    if len(active_ids) == 0:
        return 0

    cursor = connection.cursor()
    cursor.execute("DROP TABLE IF EXISTS _current_ingestion_ids")
    cursor.execute("CREATE TEMP TABLE _current_ingestion_ids (id TEXT PRIMARY KEY)")
    cursor.executemany(
        "INSERT OR IGNORE INTO _current_ingestion_ids (id) VALUES (?)",
        [(identifier,) for identifier in active_ids],
    )

    placeholders = ", ".join("?" for _ in target_platforms)
    cursor.execute(
        f"""
        UPDATE hackathons
        SET is_active = 0
        WHERE source_platform IN ({placeholders})
          AND id NOT IN (SELECT id FROM _current_ingestion_ids)
        """,
        target_platforms,
    )
    deactivated = max(int(cursor.rowcount or 0), 0)

    cursor.execute("DROP TABLE IF EXISTS _current_ingestion_ids")
    connection.commit()
    return deactivated


def _resolve_sources(raw_sources: Optional[str]) -> List[str]:
    if raw_sources is None or not raw_sources.strip():
        return list(SUPPORTED_SOURCES)

    requested = [
        source.strip().lower()
        for source in raw_sources.split(",")
        if source.strip()
    ]
    valid = [source for source in requested if source in SUPPORTED_SOURCES]
    return valid if valid else list(SUPPORTED_SOURCES)


def ingest_all_sources(
    max_pages: int = 5,
    geocode: bool = True,
    sources: Optional[Sequence[str]] = None,
    mlh_season_year: Optional[int] = None,
) -> List[Dict[str, object]]:
    current_time = datetime.now(timezone.utc)
    selected_sources = list(sources) if sources else list(SUPPORTED_SOURCES)
    records: List[Dict[str, object]] = []

    if "devpost" in selected_sources:
        records.extend(
            normalize_devpost_hackathons(
                fetch_devpost_hackathons(max_pages=max_pages),
                now=current_time,
            )
        )

    if "devfolio" in selected_sources:
        records.extend(
            normalize_devfolio_hackathons(
                fetch_devfolio_hackathons(),
                now=current_time,
            )
        )

    if "hackerearth" in selected_sources:
        records.extend(
            normalize_hackerearth_hackathons(
                fetch_hackerearth_hackathons(),
                now=current_time,
            )
        )

    if "unstop" in selected_sources:
        records.extend(
            normalize_unstop_hackathons(
                fetch_unstop_hackathons(max_pages=max_pages),
                now=current_time,
            )
        )

    if "mlh" in selected_sources:
        records.extend(
            normalize_mlh_hackathons(
                fetch_mlh_hackathons(season_year=mlh_season_year),
                now=current_time,
            )
        )

    deduped = _dedupe_by_id(records)
    _apply_geocoding(deduped, enabled=geocode)
    return deduped


def run_pipeline(
    max_pages: int,
    db_path: Optional[Path],
    json_output_path: Optional[Path],
    geocode: bool,
    sources: Sequence[str],
    mlh_season_year: Optional[int],
) -> Dict[str, int]:
    records = ingest_all_sources(
        max_pages=max_pages,
        geocode=geocode,
        sources=sources,
        mlh_season_year=mlh_season_year,
    )
    summary = {
        "fetched": len(records),
        "written_to_db": 0,
        "written_to_json": 0,
        "deactivated_in_db": 0,
    }

    if db_path is not None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(db_path)
        try:
            _ensure_schema(connection)
            summary["deactivated_in_db"] = _deactivate_stale_records(
                connection=connection,
                records=records,
                selected_sources=sources,
            )
            summary["written_to_db"] = _upsert_records(connection, records)
        finally:
            connection.close()

    if json_output_path is not None:
        json_output_path.parent.mkdir(parents=True, exist_ok=True)
        json_records = _serialize_for_json(records)
        json_output_path.write_text(
            json.dumps(json_records, indent=2, ensure_ascii=True), encoding="utf-8"
        )
        summary["written_to_json"] = len(json_records)

    return summary


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="HackHunt ingestion pipeline runner")
    parser.add_argument(
        "--max-pages",
        type=int,
        default=int(os.getenv("HACKHUNT_INGEST_MAX_PAGES", "0")),
        help="Number of pages to fetch for paginated providers (0 means all pages).",
    )
    parser.add_argument(
        "--sources",
        type=str,
        default=os.getenv("HACKHUNT_INGEST_SOURCES", ""),
        help=(
            "Comma-separated sources to ingest. "
            "Supported: devpost,devfolio,hackerearth,unstop,mlh"
        ),
    )
    parser.add_argument(
        "--mlh-season-year",
        type=int,
        default=(
            int(os.getenv("HACKHUNT_MLH_SEASON_YEAR"))
            if os.getenv("HACKHUNT_MLH_SEASON_YEAR")
            else None
        ),
        help="MLH season year to ingest (defaults to current UTC year).",
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path(os.getenv("HACKHUNT_DB_PATH", str(DEFAULT_DB_PATH))),
        help="SQLite database path for upserts. Use an empty string to skip DB write.",
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        default=DEFAULT_JSON_OUTPUT_PATH,
        help="JSON output path for app bootstrap ingestion data.",
    )
    parser.add_argument(
        "--disable-geocoding",
        action="store_true",
        help="Disable location geocoding for offline/hybrid events.",
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Skip SQLite upsert writes.",
    )
    parser.add_argument(
        "--skip-json",
        action="store_true",
        help="Skip JSON output write.",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    selected_sources = _resolve_sources(args.sources)
    summary = run_pipeline(
        max_pages=max(0, args.max_pages),
        db_path=None if args.skip_db else args.db_path,
        json_output_path=None if args.skip_json else args.json_output,
        geocode=not args.disable_geocoding,
        sources=selected_sources,
        mlh_season_year=args.mlh_season_year,
    )
    print(
        json.dumps(
            {
                "status": "ok",
                "sources": selected_sources,
                "fetched": summary["fetched"],
                "written_to_db": summary["written_to_db"],
                "written_to_json": summary["written_to_json"],
                "deactivated_in_db": summary["deactivated_in_db"],
            }
        )
    )


if __name__ == "__main__":
    main()
