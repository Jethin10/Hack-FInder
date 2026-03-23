import sqlite3
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from app.ingestion.pipeline import run_pipeline


def _record(identifier: str, source_platform: str = "Devpost") -> dict[str, object]:
    now = datetime(2026, 3, 1, tzinfo=timezone.utc).isoformat()
    return {
        "id": identifier,
        "title": f"Event {identifier}",
        "url": f"https://example.com/{identifier}",
        "source_platform": source_platform,
        "format": "Online",
        "location_text": "Global",
        "latitude": None,
        "longitude": None,
        "start_date": now,
        "final_submission_date": now,
        "days_to_final": 0,
        "themes": [],
        "organizer_past_events": 0,
        "prizes": ["Unspecified"],
        "created_at": now,
    }


class PipelineTests(unittest.TestCase):
    def test_deactivates_stale_records_for_selected_source(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "hackhunt.db"

            with patch(
                "app.ingestion.pipeline.ingest_all_sources",
                return_value=[_record("devpost-1"), _record("devpost-2")],
            ):
                run_pipeline(
                    max_pages=1,
                    db_path=db_path,
                    json_output_path=None,
                    geocode=False,
                    sources=["devpost"],
                    mlh_season_year=None,
                )

            with patch(
                "app.ingestion.pipeline.ingest_all_sources",
                return_value=[_record("devpost-1")],
            ):
                run_pipeline(
                    max_pages=1,
                    db_path=db_path,
                    json_output_path=None,
                    geocode=False,
                    sources=["devpost"],
                    mlh_season_year=None,
                )

            connection = sqlite3.connect(db_path)
            try:
                rows = connection.execute(
                    "SELECT id, is_active FROM hackathons ORDER BY id"
                ).fetchall()
            finally:
                connection.close()

            self.assertEqual(rows, [("devpost-1", 1), ("devpost-2", 0)])

    def test_does_not_deactivate_unselected_sources(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "hackhunt.db"

            with patch(
                "app.ingestion.pipeline.ingest_all_sources",
                return_value=[_record("devpost-1"), _record("unstop-1", "Unstop")],
            ):
                run_pipeline(
                    max_pages=1,
                    db_path=db_path,
                    json_output_path=None,
                    geocode=False,
                    sources=["devpost", "unstop"],
                    mlh_season_year=None,
                )

            with patch(
                "app.ingestion.pipeline.ingest_all_sources",
                return_value=[_record("devpost-1")],
            ):
                run_pipeline(
                    max_pages=1,
                    db_path=db_path,
                    json_output_path=None,
                    geocode=False,
                    sources=["devpost"],
                    mlh_season_year=None,
                )

            connection = sqlite3.connect(db_path)
            try:
                rows = connection.execute(
                    "SELECT id, is_active FROM hackathons ORDER BY id"
                ).fetchall()
            finally:
                connection.close()

            self.assertEqual(rows, [("devpost-1", 1), ("unstop-1", 1)])


if __name__ == "__main__":
    unittest.main()
